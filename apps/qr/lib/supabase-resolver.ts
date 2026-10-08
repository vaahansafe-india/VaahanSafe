import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseClient } from "@vaahansafe/database";
import type {
  HotPathQueryResultRow,
  ContactQueryResultRow,
  PublicQrEntitlementRow,
  PublicQrReadRepository,
} from "@vaahansafe/qr-core";

type Profile = Pick<
  HotPathQueryResultRow,
  | "display_name"
  | "blood_group"
  | "medical_notes"
  | "public_vehicle_details"
  | "show_owner_name"
  | "show_blood_group"
  | "show_medical_notes"
  | "show_vehicle_details"
> & {
  id: string;
  status: string;
  updated_at: string;
  contacts: ContactQueryResultRow[];
};
type Vehicle = Pick<
  HotPathQueryResultRow,
  "make" | "model" | "color" | "vehicle_type" | "registration_number"
> & { id: string; user_id: string; status: string; profiles: Profile | null };
type Sticker = {
  id: string;
  public_id: string;
  visible_code: string;
  status: string;
  replaced_by_qr_id: string | null;
};
type JoinedQr = Sticker & {
  entitlements: PublicQrEntitlementRow[];
  assignments: {
    user_id: string;
    ended_at: string | null;
    vehicle: Vehicle | null;
  }[];
};
type Table<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};
// These canonical tables were verified against the live Supabase schema. The older
// monorepo generated schema predates their TEXT identities and entitlement model.
type QrDatabase = {
  public: {
    Tables: {
      qr_stickers: Table<Sticker>;
      service_entitlements: Table<
        PublicQrEntitlementRow & { qr_sticker_id: string }
      >;
      emergency_contacts: Table<
        ContactQueryResultRow & {
          emergency_profile_id: string;
          is_enabled: number;
        }
      >;
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
};

const qrColumns = `id,public_id,visible_code,status,replaced_by_qr_id,
  entitlements:service_entitlements(id,capability,status,user_id,vehicle_id,expires_at),
  assignments:qr_assignments(user_id,ended_at,
    vehicle:vehicles(id,user_id,status,make,model,color,vehicle_type,registration_number,
      profiles:emergency_profiles(id,display_name,blood_group,medical_notes,public_vehicle_details,show_owner_name,show_blood_group,show_medical_notes,show_vehicle_details,status,updated_at,
        contacts:emergency_contacts(id,name,relationship_label,phone,priority,allow_call,allow_message))))`;

function checkError(error: { code?: string } | null, operation: string) {
  if (error)
    throw new Error(
      `QR Supabase ${operation} failed (${error.code || "SERVICE_UNAVAILABLE"})`,
    );
}

export function createSupabaseQrRepository(): PublicQrReadRepository {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!url || !key)
    throw new Error("QR Supabase server configuration is missing");
  const client = getSupabaseClient({
    url,
    key,
  }) as unknown as SupabaseClient<QrDatabase>;
  // Request-local projection of one authoritative joined read. No persistent
  // cache or fallback data: each page resolution performs a fresh database read.
  let snapshot: JoinedQr | null = null;
  let approvedProfile: Profile | null = null;
  return {
    async findQr(publicId) {
      const { data, error } = await client
        .from("qr_stickers")
        .select(qrColumns)
        .eq("public_id", publicId)
        .eq("entitlements.capability", "SAFETY_VIEW_ACTIVE")
        .eq("assignments.vehicle.profiles.contacts.is_enabled", 1)
        .eq("assignments.vehicle.profiles.contacts.allow_call", 1)
        .order("priority", {
          referencedTable: "assignments.vehicle.profiles.contacts",
        })
        .limit(3, { referencedTable: "assignments.vehicle.profiles.contacts" })
        .returns<JoinedQr[]>()
        .abortSignal(AbortSignal.timeout(8000))
        .maybeSingle();
      checkError(error, "lookup");
      snapshot = data;
      approvedProfile = null;
      if (!data) return null;
      const validBindings = data.assignments.filter(
        (a) =>
          a.ended_at === null &&
          a.vehicle?.status === "ACTIVE" &&
          a.user_id === a.vehicle.user_id,
      );
      // Ambiguous ownership is unavailable instead of selecting an arbitrary binding.
      const vehicle =
        validBindings.length === 1 ? validBindings[0]!.vehicle : null;
      const profile =
        vehicle?.profiles?.status === "ACTIVE" ? vehicle.profiles : null;
      approvedProfile = profile;
      let replacementId: string | null = null;
      if (data.status === "REPLACED" && data.replaced_by_qr_id) {
        const replacement = await client
          .from("qr_stickers")
          .select("public_id")
          .eq("id", data.replaced_by_qr_id)
          .returns<{ public_id: string }[]>()
          .abortSignal(AbortSignal.timeout(8000))
          .maybeSingle();
        checkError(replacement.error, "replacement lookup");
        replacementId = replacement.data?.public_id || null;
      }
      return {
        qr_id: data.id,
        public_id: data.public_id,
        visible_code: data.visible_code,
        qr_status: data.status,
        replaced_by_qr_id: data.replaced_by_qr_id,
        replaced_by_public_id: replacementId,
        vehicle_id: vehicle?.id || null,
        owner_user_id: vehicle?.user_id || null,
        make: vehicle?.make || null,
        model: vehicle?.model || null,
        color: vehicle?.color || null,
        vehicle_type: vehicle?.vehicle_type || null,
        registration_number: vehicle?.registration_number || null,
        emergency_profile_id: profile?.id || null,
        display_name: profile?.display_name || null,
        blood_group: profile?.blood_group || null,
        medical_notes: profile?.medical_notes || null,
        public_vehicle_details: profile?.public_vehicle_details || null,
        show_owner_name: profile?.show_owner_name ?? 0,
        show_blood_group: profile?.show_blood_group ?? 0,
        show_medical_notes: profile?.show_medical_notes ?? 0,
        show_vehicle_details: profile?.show_vehicle_details ?? 0,
        profile_status: profile?.status || null,
        profile_updated_at: profile?.updated_at || null,
      };
    },
    async findEntitlements(qrId) {
      if (!snapshot || snapshot.id !== qrId)
        throw new Error("QR entitlement projection is unresolved");
      return snapshot.entitlements;
    },
    async findContacts(profileId) {
      if (!approvedProfile || approvedProfile.id !== profileId)
        throw new Error("QR contact projection is unresolved");
      return approvedProfile.contacts;
    },
  };
}

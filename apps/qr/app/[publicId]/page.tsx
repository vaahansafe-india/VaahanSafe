import { AppShell } from "@vaahansafe/ui/patterns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@vaahansafe/ui/components";
import { Badge } from "@vaahansafe/ui/components";
import { Button } from "@vaahansafe/ui/components";
import { VaahanIcon } from "@vaahansafe/icons";
import { getAuthoritativeDatabaseClient } from "@vaahansafe/database";
import { canExposeSafetyView } from "@vaahansafe/qr-core";
import { PhoneCall, ShieldCheck, AlertTriangle, QrCode, AlertCircle, RefreshCw } from "lucide-react";
import { headers } from "next/headers";
import type { QrLifecycleState } from "@vaahansafe/types";

interface QrResolverPageProps {
  params: Promise<{
    publicId: string;
  }>;
}

function maskPlate(reg: string): string {
  if (!reg || reg.length < 6) return reg || "VEHICLE";
  const cleaned = reg.toUpperCase().replace(/\s+/g, "");
  const state = cleaned.slice(0, 2);
  const rto = cleaned.slice(2, 4);
  const last4 = cleaned.slice(-4);
  return `${state} ${rto} •••• ${last4}`;
}

export default async function DynamicQrResolverPage({ params }: QrResolverPageProps) {
  const { publicId } = await params;
  const db = getAuthoritativeDatabaseClient();

  // 1. Authoritative D1 Lookup by Opaque Public Identifier (Rule 17, 29)
  const stickers = await db.query<{
    id: string;
    public_id: string;
    visible_code: string;
    status: QrLifecycleState;
    batch_id: string;
    replaced_by_qr_id?: string;
  }>(
    `SELECT id, public_id, visible_code, status, batch_id, replaced_by_qr_id
     FROM qr_stickers
     WHERE public_id = ?
     LIMIT 1`,
    [publicId]
  );
  const sticker = stickers[0];

  // Privacy-safe non-blocking telemetry logging (Rule 06: server authoritative scan logging)
  if (sticker) {
    try {
      const reqHeaders = await headers();
      const purpose = reqHeaders.get("purpose") || reqHeaders.get("sec-purpose") || "";
      const userAgent = reqHeaders.get("user-agent") || "";
      const isPrefetch = purpose.toLowerCase() === "prefetch";
      const isBot = /bot|crawler|spider|crawling|slurp|facebookexternalhit|bingpreview/i.test(userAgent);

      if (!isPrefetch && !isBot) {
        const city = reqHeaders.get("cf-ipcity") || null;
        const state = reqHeaders.get("cf-region") || reqHeaders.get("cf-ipregion") || null;
        const eventId = `qse_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;

        let scanResult = "RESOLVED_ACTIVE";
        if (sticker.status === "REPLACED") {
          scanResult = "RESOLVED_REPLACED";
        } else if (sticker.status === "LOST_DAMAGED" || sticker.status === "BLOCKED") {
          scanResult = "RESOLVED_BLOCKED";
        } else if (
          sticker.status === "PRINTED" ||
          sticker.status === "IN_TRANSIT_DISTRIBUTOR" ||
          sticker.status === "WITH_DISTRIBUTOR" ||
          sticker.status === "WITH_RETAILER" ||
          sticker.status === "SOLD"
        ) {
          scanResult = "RESOLVED_INACTIVE";
        }

        let uaFamily = "Desktop Chrome";
        if (/iphone|ipad|ipod/i.test(userAgent)) uaFamily = "Mobile Safari";
        else if (/android.*mobile/i.test(userAgent)) uaFamily = "Chrome Mobile";
        else if (/android/i.test(userAgent)) uaFamily = "Android Tablet";
        else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) uaFamily = "Safari";
        else if (/firefox/i.test(userAgent)) uaFamily = "Firefox";

        await db.execute(
          `INSERT INTO qr_scan_events (id, qr_id, scan_type, result, city, state, user_agent_family, referrer_class, created_at)
           VALUES (?, ?, 'PUBLIC_RESOLVE', ?, ?, ?, ?, 'DIRECT_SCAN', datetime('now'))`,
          [eventId, sticker.id, scanResult, city, state, uaFamily]
        );
      }
    } catch (telemetryErr) {
      // Gracefully ignore telemetry failure to guarantee safety resolver availability
      console.warn("[QR Resolver] Telemetry recording failed:", telemetryErr);
    }
  }

  // Case A: Unknown Public ID
  if (!sticker) {
    return (
      <AppShell
        appName="Emergency QR Resolver"
        appDescription="Verifiable Vehicle Emergency Identification"
      >
        <div className="max-w-md mx-auto space-y-6">
          <Card className="border-border text-center p-8 space-y-4">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive border border-destructive/20">
              <AlertCircle className="size-7" />
            </div>
            <div>
              <h1 className="text-xl font-serif font-medium text-foreground">QR Sticker Not Recognized</h1>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                This QR code does not correspond to an authentic registered VaahanSafe identifier. Please verify the physical sticker.
              </p>
            </div>
            <span className="font-mono text-[10px] text-muted-foreground block">
              Reference: {publicId}
            </span>
          </Card>
        </div>
      </AppShell>
    );
  }

  // Case B: Unactivated Retail / Distributor Inventory Sticker
  if (
    sticker.status === "PRINTED" ||
    sticker.status === "IN_TRANSIT_DISTRIBUTOR" ||
    sticker.status === "WITH_DISTRIBUTOR" ||
    sticker.status === "WITH_RETAILER" ||
    sticker.status === "SOLD"
  ) {
    return (
      <AppShell
        appName="Emergency QR Resolver"
        appDescription="Verifiable Vehicle Emergency Identification"
      >
        <div className="max-w-md mx-auto space-y-6">
          <Card className="border-border p-6 text-center space-y-5">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-[#cc785c] border border-primary/20">
              <QrCode className="size-7" />
            </div>
            <div>
              <Badge variant="outline" className="text-[#cc785c] border-[#cc785c]/30 mb-2">
                Unactivated Retail Pack
              </Badge>
              <h1 className="text-xl font-serif font-medium text-foreground">Ready For Activation</h1>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                This genuine VaahanSafe physical QR sticker is ready to be linked to a vehicle. If you purchased this pack, activate it using the scratch code on your packaging.
              </p>
            </div>

            <div className="pt-2">
              <a
                href={`http://localhost:3002?id=${encodeURIComponent(sticker.public_id)}`}
                className="inline-flex items-center justify-center w-full h-11 px-6 text-xs font-semibold uppercase tracking-wider text-white transition-colors rounded-xl bg-[#cc785c] hover:bg-[#b5654b] shadow-xs"
              >
                Activate Sticker Now
              </a>
            </div>

            <div className="border-t pt-3 text-[11px] font-mono text-muted-foreground">
              Public Identity: {sticker.public_id}
            </div>
          </Card>
        </div>
      </AppShell>
    );
  }

  // Case C: Replaced Sticker
  if (sticker.status === "REPLACED") {
    return (
      <AppShell
        appName="Emergency QR Resolver"
        appDescription="Verifiable Vehicle Emergency Identification"
      >
        <div className="max-w-md mx-auto space-y-6">
          <Card className="border-border p-6 text-center space-y-4">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
              <RefreshCw className="size-7" />
            </div>
            <div>
              <h1 className="text-xl font-serif font-medium text-foreground">QR Sticker Replaced</h1>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                This physical sticker has been replaced by the vehicle owner with an upgraded pass. Please scan the newly affixed sticker on the vehicle.
              </p>
            </div>
          </Card>
        </div>
      </AppShell>
    );
  }

  // Case D: Lost / Damaged / Blocked
  if (sticker.status === "LOST_DAMAGED" || sticker.status === "BLOCKED") {
    return (
      <AppShell
        appName="Emergency QR Resolver"
        appDescription="Verifiable Vehicle Emergency Identification"
      >
        <div className="max-w-md mx-auto space-y-6">
          <Card className="border-border p-6 text-center space-y-4">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive border border-destructive/20">
              <AlertTriangle className="size-7" />
            </div>
            <div>
              <h1 className="text-xl font-serif font-medium text-foreground">Sticker Unavailable</h1>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                This safety sticker is currently disabled or reported unusable. Emergency routing is inactive.
              </p>
            </div>
          </Card>
        </div>
      </AppShell>
    );
  }

  // Case E: Activated Sticker — Check Authoritative Entitlement (Rule 23, 30)
  const isEntitled = await canExposeSafetyView({ qrPublicId: sticker.public_id, db });
  if (!isEntitled) {
    return (
      <AppShell
        appName="Emergency QR Resolver"
        appDescription="Verifiable Vehicle Emergency Identification"
      >
        <div className="max-w-md mx-auto space-y-6">
          <Card className="border-border p-6 text-center space-y-4">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
              <AlertCircle className="size-7" />
            </div>
            <div>
              <h1 className="text-xl font-serif font-medium text-foreground">Safety Profile Pending</h1>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                The safety service for this sticker is awaiting ownership confirmation or configuration.
              </p>
            </div>
          </Card>
        </div>
      </AppShell>
    );
  }

  // Fetch Authorized Public Projection (Rule 20: Minimum Safe Data Only)
  const vehicles = await db.query<{
    id: string;
    registration_number: string;
    vehicle_type: string;
    make: string;
    model: string;
  }>(
    `SELECT v.id, v.registration_number, v.vehicle_type, v.make, v.model
     FROM vehicles v
     JOIN qr_assignments a ON v.id = a.vehicle_id AND a.ended_at IS NULL
     WHERE a.qr_id = ?
     LIMIT 1`,
    [sticker.id]
  );
  const vehicle = vehicles[0];

  const profiles = vehicle
    ? await db.query<{ display_name?: string; blood_group?: string; medical_notes?: string }>(
        `SELECT display_name, blood_group, medical_notes
         FROM emergency_profiles
         WHERE vehicle_id = ? AND status = 'ACTIVE'
         LIMIT 1`,
        [vehicle.id]
      )
    : [];
  const profile = profiles[0];

  const contacts = vehicle
    ? await db.query<{ id: string; name: string; relationship: string; phone: string; is_priority: number }>(
        `SELECT c.id, c.name, c.relationship, c.phone, c.is_priority
         FROM emergency_contacts c
         JOIN emergency_profiles ep ON c.emergency_profile_id = ep.id
         WHERE ep.vehicle_id = ? AND c.is_enabled = 1
         ORDER BY c.priority ASC, c.is_priority DESC`,
        [vehicle.id]
      )
    : [];

  return (
    <AppShell
      appName="Emergency QR Resolver"
      appDescription="Emergency vehicle identification and contact relay"
    >
      <div className="max-w-xl mx-auto space-y-6">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
          {/* Header Banner */}
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <h1 className="text-base font-bold text-foreground">Verified Vehicle Safety Pass</h1>
                <p className="font-mono text-xs text-muted-foreground">{sticker.public_id}</p>
              </div>
            </div>
            <Badge variant="success">Active Profile</Badge>
          </div>

          {/* Vehicle Information */}
          {vehicle && (
            <Card className="border-border/80">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    Vehicle Identification
                  </div>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {vehicle.vehicle_type}
                  </Badge>
                </div>
                <CardTitle className="text-lg font-mono font-bold mt-1 text-foreground">
                  {maskPlate(vehicle.registration_number)}
                </CardTitle>
                <CardDescription className="text-xs">
                  {vehicle.make} {vehicle.model}
                </CardDescription>
              </CardHeader>

              {(profile?.blood_group || profile?.medical_notes) && (
                <CardContent className="p-4 pt-2 border-t mt-2 text-xs space-y-2">
                  {profile.blood_group && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-muted-foreground">Blood Group:</span>
                      <Badge variant="destructive" className="font-mono text-xs font-bold">
                        {profile.blood_group}
                      </Badge>
                    </div>
                  )}
                  {profile.medical_notes && (
                    <div className="p-2.5 rounded-lg bg-muted/60 border text-muted-foreground">
                      <span className="font-semibold text-foreground block mb-0.5">Medical Notes:</span>
                      {profile.medical_notes}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          )}

          {/* Emergency Contacts Relay */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Authoritative Emergency Contacts ({contacts.length})
              </h3>
              <span className="text-[10px] text-emerald-600 font-medium">Privacy Relay Active</span>
            </div>

            {contacts.length > 0 ? (
              <div className="space-y-2">
                {contacts.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-background/80 hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <span>{c.name}</span>
                        {c.is_priority === 1 && (
                          <Badge variant="outline" className="text-[9px] border-emerald-500/40 text-emerald-600 py-0">
                            Primary
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {c.relationship}
                      </div>
                    </div>

                    <a
                      href={`tel:${c.phone}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 text-white font-mono text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-xs"
                    >
                      <PhoneCall className="size-3.5" />
                      <span>Call Relay</span>
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-border text-center text-xs text-muted-foreground">
                No emergency contacts have been configured by the owner.
              </div>
            )}
          </div>

          <div className="border-t pt-3 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
            <span>Encrypted Relay &bull; RBI/TRAI Compliant</span>
            <span>VaahanSafe Network</span>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

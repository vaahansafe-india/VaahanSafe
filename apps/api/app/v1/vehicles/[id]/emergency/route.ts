import { NextRequest, NextResponse } from "next/server";
import { requireUserSession } from "../../../_auth";
import { getApiDatabase } from "../../../_db";
import { getVehicleRepository, getEmergencyRepository } from "@vaahansafe/database";

export const dynamic = "force-dynamic";

/**
 * Vehicle Emergency Profile & Contacts (GET, PATCH /v1/vehicles/:id/emergency)
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authOrResponse = await requireUserSession(req);
  if (authOrResponse instanceof NextResponse) {
    return authOrResponse;
  }

  const { user } = authOrResponse;
  const { id: vehicleId } = await context.params;

  const db = getApiDatabase();
  const vehicleRepo = getVehicleRepository(db);

  try {
    const vehicle = await vehicleRepo.findById(vehicleId);
    if (!vehicle || vehicle.customerId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Vehicle not found", code: "ERR_NOT_FOUND" },
        { status: 404 }
      );
    }

    const emergencyRepo = getEmergencyRepository(db);
    const data = await emergencyRepo.findByVehicleId(vehicleId);

    // Also get profile privacy switches
    const profileRow = await db.queryFirst<{
      id: string;
      blood_group: string | null;
      medical_notes: string | null;
      show_owner_name: number;
      show_blood_group: number;
      show_medical_notes: number;
      show_vehicle_details: number;
    }>(
      "SELECT id, blood_group, medical_notes, show_owner_name, show_blood_group, show_medical_notes, show_vehicle_details FROM emergency_profiles WHERE vehicle_id = ?",
      [vehicleId]
    );

    return NextResponse.json(
      {
        success: true,
        emergency: {
          profile: profileRow
            ? {
                bloodGroup: profileRow.blood_group,
                medicalNotes: profileRow.medical_notes,
                showOwnerName: profileRow.show_owner_name === 1,
                showBloodGroup: profileRow.show_blood_group === 1,
                showMedicalNotes: profileRow.show_medical_notes === 1,
                showVehicleDetails: profileRow.show_vehicle_details === 1,
              }
            : null,
          contacts: data.contacts,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[ApiVehicleEmergencyGet] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load emergency profile", code: "ERR_LOAD_EMERGENCY" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authOrResponse = await requireUserSession(req);
  if (authOrResponse instanceof NextResponse) {
    return authOrResponse;
  }

  const { user } = authOrResponse;
  const { id: vehicleId } = await context.params;
  const body = await req.json().catch(() => ({}));

  const db = getApiDatabase();
  const vehicleRepo = getVehicleRepository(db);

  try {
    const vehicle = await vehicleRepo.findById(vehicleId);
    if (!vehicle || vehicle.customerId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Vehicle not found", code: "ERR_NOT_FOUND" },
        { status: 404 }
      );
    }

    const {
      bloodGroup,
      medicalNotes,
      showOwnerName,
      showBloodGroup,
      showMedicalNotes,
      showVehicleDetails,
      contacts,
    } = body || {};

    const now = new Date().toISOString();

    // 1. Upsert emergency profile
    let profile = await db.queryFirst<{ id: string }>(
      "SELECT id FROM emergency_profiles WHERE vehicle_id = ?",
      [vehicleId]
    );

    const profileId = profile?.id || `ep_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    if (profile) {
      await db.execute(
        `UPDATE emergency_profiles SET
           blood_group = COALESCE(?, blood_group),
           medical_notes = COALESCE(?, medical_notes),
           show_owner_name = COALESCE(?, show_owner_name),
           show_blood_group = COALESCE(?, show_blood_group),
           show_medical_notes = COALESCE(?, show_medical_notes),
           show_vehicle_details = COALESCE(?, show_vehicle_details),
           updated_at = ?
         WHERE id = ?`,
        [
          bloodGroup !== undefined ? bloodGroup : null,
          medicalNotes !== undefined ? medicalNotes : null,
          showOwnerName !== undefined ? (showOwnerName ? 1 : 0) : null,
          showBloodGroup !== undefined ? (showBloodGroup ? 1 : 0) : null,
          showMedicalNotes !== undefined ? (showMedicalNotes ? 1 : 0) : null,
          showVehicleDetails !== undefined ? (showVehicleDetails ? 1 : 0) : null,
          now,
          profile.id,
        ]
      );
    } else {
      await db.execute(
        `INSERT INTO emergency_profiles (
           id, vehicle_id, blood_group, medical_notes,
           show_owner_name, show_blood_group, show_medical_notes, show_vehicle_details,
           status, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)`,
        [
          profileId,
          vehicleId,
          bloodGroup || null,
          medicalNotes || null,
          showOwnerName !== false ? 1 : 0,
          showBloodGroup !== false ? 1 : 0,
          showMedicalNotes ? 1 : 0,
          showVehicleDetails !== false ? 1 : 0,
          now,
          now,
        ]
      );
    }

    // 2. If contacts array provided, replace existing contacts for this profile
    if (Array.isArray(contacts)) {
      await db.execute("DELETE FROM emergency_contacts WHERE emergency_profile_id = ?", [
        profile?.id || profileId,
      ]);

      for (let i = 0; i < Math.min(contacts.length, 5); i++) {
        const c = contacts[i];
        if (c.name && c.phone) {
          const contactId = `ec_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`;
          await db.execute(
            `INSERT INTO emergency_contacts (
               id, emergency_profile_id, name, relationship_label, phone, priority,
               is_enabled, allow_call, allow_message, created_at, updated_at
             ) VALUES (?, ?, ?, ?, ?, ?, 1, 1, ?, ?, ?)`,
            [
              contactId,
              profile?.id || profileId,
              String(c.name).trim(),
              String(c.relationship || "Contact").trim(),
              String(c.phone).trim(),
              i + 1,
              c.notifyOnScan !== false ? 1 : 0,
              now,
              now,
            ]
          );
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Emergency profile updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[ApiVehicleEmergencyPatch] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update emergency settings", code: "ERR_UPDATE_EMERGENCY" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedCustomer } from "@/lib/session";
import { getAuthoritativeDatabaseClient } from "@vaahansafe/database";

export async function POST(req: NextRequest) {
  const auth = await getAuthenticatedCustomer();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      vehicleId,
      showOwnerName,
      showBloodGroup,
      showMedicalNotes,
      showVehicleDetails,
      bloodGroup,
      medicalNotes,
    } = body;

    if (!vehicleId || typeof vehicleId !== "string") {
      return NextResponse.json({ error: "Vehicle ID required" }, { status: 400 });
    }

    const db = getAuthoritativeDatabaseClient();

    // Verify ownership of the vehicle
    const vehicle = await db.queryFirst<{ id: string }>(
      `SELECT id FROM vehicles WHERE id = ? AND user_id = ?`,
      [vehicleId, auth.user.id]
    );

    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found or unauthorized" }, { status: 404 });
    }

    // Check if profile exists
    const existing = await db.queryFirst<{ id: string }>(
      `SELECT id FROM emergency_profiles WHERE vehicle_id = ? AND status = 'ACTIVE'`,
      [vehicleId]
    );

    const now = new Date().toISOString();

    if (existing) {
      await db.execute(
        `UPDATE emergency_profiles SET
          show_owner_name = COALESCE(?, show_owner_name),
          show_blood_group = COALESCE(?, show_blood_group),
          show_medical_notes = COALESCE(?, show_medical_notes),
          show_vehicle_details = COALESCE(?, show_vehicle_details),
          blood_group = COALESCE(?, blood_group),
          medical_notes = COALESCE(?, medical_notes),
          updated_at = ?
        WHERE id = ?`,
        [
          typeof showOwnerName === "boolean" ? (showOwnerName ? 1 : 0) : null,
          typeof showBloodGroup === "boolean" ? (showBloodGroup ? 1 : 0) : null,
          typeof showMedicalNotes === "boolean" ? (showMedicalNotes ? 1 : 0) : null,
          typeof showVehicleDetails === "boolean" ? (showVehicleDetails ? 1 : 0) : null,
          bloodGroup !== undefined ? bloodGroup : null,
          medicalNotes !== undefined ? medicalNotes : null,
          now,
          existing.id,
        ]
      );
    } else {
      const profileId = `ep_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      await db.execute(
        `INSERT INTO emergency_profiles (
          id, vehicle_id, display_name, blood_group, medical_notes,
          show_owner_name, show_blood_group, show_medical_notes, show_vehicle_details,
          status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)`,
        [
          profileId,
          vehicleId,
          auth.user.name || null,
          bloodGroup || null,
          medicalNotes || null,
          showOwnerName ? 1 : 0,
          showBloodGroup ? 1 : 0,
          showMedicalNotes ? 1 : 0,
          showVehicleDetails ? 1 : 0,
          now,
          now,
        ]
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[SafetyView API] Error updating visibility settings:", err);
    return NextResponse.json(
      { error: "Failed to update safety projection settings" },
      { status: 500 }
    );
  }
}

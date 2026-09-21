import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedCustomer } from "@/lib/session";
import { getAuthoritativeDatabaseClient } from "@vaahansafe/database";
import {
  generateVehicleId,
  normalizeRegistrationNumber,
  isValidRegistrationFormat,
} from "@vaahansafe/vehicles";

export async function POST(req: NextRequest) {
  const auth = await getAuthenticatedCustomer();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { registrationNumber, make, model, type, year, color } = body;

    if (!registrationNumber || typeof registrationNumber !== "string") {
      return NextResponse.json(
        { error: "Registration number is required" },
        { status: 400 }
      );
    }

    const normalizedReg = normalizeRegistrationNumber(registrationNumber);
    if (!normalizedReg || !isValidRegistrationFormat(normalizedReg)) {
      return NextResponse.json(
        {
          error:
            "Invalid registration number format. Please enter a valid Indian vehicle registration (e.g. MH12AB1234 or 22BH1234AA)",
        },
        { status: 400 }
      );
    }

    if (!make || typeof make !== "string" || !make.trim()) {
      return NextResponse.json(
        { error: "Vehicle make / manufacturer is required" },
        { status: 400 }
      );
    }

    if (!model || typeof model !== "string" || !model.trim()) {
      return NextResponse.json(
        { error: "Vehicle model is required" },
        { status: 400 }
      );
    }

    const validTypes = ["CAR", "MOTORCYCLE", "SCOOTER", "AUTO", "COMMERCIAL", "OTHER"];
    const vehicleType = validTypes.includes(type) ? type : "CAR";

    const parsedYear =
      year && !isNaN(Number(year)) && Number(year) >= 1950 && Number(year) <= new Date().getFullYear() + 1
        ? Number(year)
        : null;

    const db = getAuthoritativeDatabaseClient();

    // Check if user already registered this active plate
    const existing = await db.queryFirst<{ id: string }>(
      `SELECT id FROM vehicles WHERE user_id = ? AND registration_number_normalized = ? AND status != 'DELETED'`,
      [auth.user.id, normalizedReg]
    );

    if (existing) {
      return NextResponse.json(
        { error: "You have already registered a vehicle with this plate number" },
        { status: 409 }
      );
    }

    const vehicleId = generateVehicleId();
    const now = new Date().toISOString();

    // Insert vehicle and default emergency profile atomically
    const profileId = `ep_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    await db.batch([
      {
        sql: `INSERT INTO vehicles (
                id, user_id, registration_number, registration_number_normalized,
                vehicle_type, make, model, year, color, status, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)`,
        params: [
          vehicleId,
          auth.user.id,
          registrationNumber.trim().toUpperCase(),
          normalizedReg,
          vehicleType,
          make.trim(),
          model.trim(),
          parsedYear,
          color ? String(color).trim() : null,
          now,
          now,
        ],
      },
      {
        sql: `INSERT INTO emergency_profiles (
                id, vehicle_id, display_name, show_owner_name, show_blood_group,
                show_medical_notes, show_vehicle_details, status, created_at, updated_at
              ) VALUES (?, ?, ?, 1, 1, 0, 1, 'ACTIVE', ?, ?)`,
        params: [profileId, vehicleId, auth.user.name || null, now, now],
      },
    ]);

    const created = await db.queryFirst<{
      id: string;
      registration_number: string;
      make: string;
      model: string;
      vehicle_type: string;
    }>(
      `SELECT id, registration_number, make, model, vehicle_type FROM vehicles WHERE id = ?`,
      [vehicleId]
    );

    return NextResponse.json({
      success: true,
      vehicle: created,
    });
  } catch (err) {
    console.error("[Vehicles API] Error creating vehicle:", err);
    return NextResponse.json(
      { error: "Failed to add vehicle. Please try again." },
      { status: 500 }
    );
  }
}

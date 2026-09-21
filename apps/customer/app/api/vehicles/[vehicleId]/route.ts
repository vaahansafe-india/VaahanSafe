import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedCustomer } from "@/lib/session";
import { getAuthoritativeDatabaseClient } from "@vaahansafe/database";

interface RouteParams {
  params: Promise<{
    vehicleId: string;
  }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const auth = await getAuthenticatedCustomer();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { vehicleId } = await params;
  if (!vehicleId) {
    return NextResponse.json({ error: "Vehicle ID required" }, { status: 400 });
  }

  try {
    const db = getAuthoritativeDatabaseClient();

    // Authorize ownership
    const vehicle = await db.queryFirst<{ id: string }>(
      `SELECT id FROM vehicles WHERE id = ? AND user_id = ? AND status != 'DELETED'`,
      [vehicleId, auth.user.id]
    );

    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found or unauthorized" }, { status: 404 });
    }

    const body = await req.json();
    const { make, model, type, year, color } = body;

    const validTypes = ["CAR", "MOTORCYCLE", "SCOOTER", "AUTO", "COMMERCIAL", "OTHER"];
    const vehicleType = type && validTypes.includes(type) ? type : null;

    const parsedYear =
      year && !isNaN(Number(year)) && Number(year) >= 1950 && Number(year) <= new Date().getFullYear() + 1
        ? Number(year)
        : null;

    const now = new Date().toISOString();

    await db.execute(
      `UPDATE vehicles SET
         make = COALESCE(?, make),
         model = COALESCE(?, model),
         vehicle_type = COALESCE(?, vehicle_type),
         year = COALESCE(?, year),
         color = COALESCE(?, color),
         updated_at = ?
       WHERE id = ? AND user_id = ?`,
      [
        make ? String(make).trim() : null,
        model ? String(model).trim() : null,
        vehicleType,
        parsedYear,
        color !== undefined ? String(color).trim() || null : null,
        now,
        vehicleId,
        auth.user.id,
      ]
    );

    const updated = await db.queryFirst<{
      id: string;
      registration_number: string;
      make: string;
      model: string;
      vehicle_type: string;
      year: number | null;
      color: string | null;
    }>(
      `SELECT id, registration_number, make, model, vehicle_type, year, color FROM vehicles WHERE id = ?`,
      [vehicleId]
    );

    return NextResponse.json({ success: true, vehicle: updated });
  } catch (err) {
    console.error(`[Vehicles API] Error updating vehicle ${vehicleId}:`, err);
    return NextResponse.json(
      { error: "Failed to update vehicle details" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const auth = await getAuthenticatedCustomer();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { vehicleId } = await params;
  if (!vehicleId) {
    return NextResponse.json({ error: "Vehicle ID required" }, { status: 400 });
  }

  try {
    const db = getAuthoritativeDatabaseClient();

    // Authorize ownership
    const vehicle = await db.queryFirst<{ id: string; registration_number: string }>(
      `SELECT id, registration_number FROM vehicles WHERE id = ? AND user_id = ? AND status != 'DELETED'`,
      [vehicleId, auth.user.id]
    );

    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found or unauthorized" }, { status: 404 });
    }

    const now = new Date().toISOString();

    // 1. Unlink any active QR assignment gracefully (preserving history)
    await db.execute(
      `UPDATE qr_assignments SET ended_at = ?, end_reason = 'UNLINKED'
       WHERE vehicle_id = ? AND ended_at IS NULL`,
      [now, vehicleId]
    );

    // 2. Soft-delete vehicle (preserves foreign-key audit trails)
    await db.execute(
      `UPDATE vehicles SET status = 'DELETED', deleted_at = ?, updated_at = ?
       WHERE id = ? AND user_id = ?`,
      [now, now, vehicleId, auth.user.id]
    );

    // 3. Mark emergency profile as disabled
    await db.execute(
      `UPDATE emergency_profiles SET status = 'DISABLED', updated_at = ?
       WHERE vehicle_id = ?`,
      [now, vehicleId]
    );

    return NextResponse.json({
      success: true,
      message: `Vehicle ${vehicle.registration_number} successfully removed`,
    });
  } catch (err) {
    console.error(`[Vehicles API] Error removing vehicle ${vehicleId}:`, err);
    return NextResponse.json(
      { error: "Failed to remove vehicle. Please try again." },
      { status: 500 }
    );
  }
}

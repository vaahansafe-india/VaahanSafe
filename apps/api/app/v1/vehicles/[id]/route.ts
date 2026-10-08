import { NextRequest, NextResponse } from "next/server";
import { requireUserSession } from "../../_auth";
import { getApiDatabase } from "../../_db";
import { getVehicleRepository } from "@vaahansafe/database";

export const dynamic = "force-dynamic";

/**
 * Individual Vehicle Endpoints (GET, PATCH, DELETE /v1/vehicles/:id)
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
  const { id } = await context.params;

  const db = getApiDatabase();
  const vehicleRepo = getVehicleRepository(db);

  try {
    const vehicle = await vehicleRepo.findById(id);
    if (!vehicle || vehicle.customerId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Vehicle not found", code: "ERR_NOT_FOUND" },
        { status: 404 }
      );
    }

    // Check QR sticker binding
    const qrRow = await db.queryFirst<{ public_code: string; status: string }>(
      "SELECT public_code, status FROM qr_stickers WHERE vehicle_id = ? AND status = 'ACTIVATED'",
      [id]
    );

    return NextResponse.json(
      {
        success: true,
        vehicle: {
          ...vehicle,
          qr: qrRow
            ? {
                publicCode: qrRow.public_code,
                status: qrRow.status,
                resolverUrl: `https://qr.vaahansafe.com/${qrRow.public_code}`,
              }
            : null,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[ApiVehicleDetailGet] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load vehicle", code: "ERR_LOAD_VEHICLE" },
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
  const { id } = await context.params;
  const body = await req.json().catch(() => ({}));

  const db = getApiDatabase();
  const vehicleRepo = getVehicleRepository(db);

  try {
    const vehicle = await vehicleRepo.findById(id);
    if (!vehicle || vehicle.customerId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Vehicle not found", code: "ERR_NOT_FOUND" },
        { status: 404 }
      );
    }

    const updated = await vehicleRepo.save({
      id,
      make: body.make ? String(body.make).trim() : vehicle.make,
      model: body.model ? String(body.model).trim() : vehicle.model,
      primaryColor: body.color !== undefined ? String(body.color).trim() : vehicle.primaryColor,
      year: body.year !== undefined ? Number(body.year) : vehicle.year,
      type: body.type ? body.type : vehicle.type,
    });

    return NextResponse.json(
      {
        success: true,
        vehicle: updated,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[ApiVehicleDetailPatch] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update vehicle", code: "ERR_UPDATE_VEHICLE" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authOrResponse = await requireUserSession(req);
  if (authOrResponse instanceof NextResponse) {
    return authOrResponse;
  }

  const { user } = authOrResponse;
  const { id } = await context.params;

  const db = getApiDatabase();

  try {
    const res = await db.execute(
      "UPDATE vehicles SET status = 'DELETED', deleted_at = datetime('now'), updated_at = datetime('now') WHERE id = ? AND user_id = ?",
      [id, user.id]
    );

    if ((res.rowsAffected ?? 0) === 0) {
      return NextResponse.json(
        { success: false, error: "Vehicle not found", code: "ERR_NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Vehicle archived successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[ApiVehicleDetailDelete] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete vehicle", code: "ERR_DELETE_VEHICLE" },
      { status: 500 }
    );
  }
}

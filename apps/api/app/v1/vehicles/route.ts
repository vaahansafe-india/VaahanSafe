import { NextRequest, NextResponse } from "next/server";
import { requireUserSession } from "../_auth";
import { getApiDatabase } from "../_db";
import { getVehicleRepository } from "@vaahansafe/database";

export const dynamic = "force-dynamic";

interface VehicleWithQrRow {
  id: string;
  registration_number: string;
  vehicle_type: string;
  make: string;
  model: string;
  year: number | null;
  color: string | null;
  status: string;
  created_at: string;
  qr_public_code: string | null;
  qr_status: string | null;
}

/**
 * Vehicle Fleet Endpoints (GET /v1/vehicles, POST /v1/vehicles)
 */
export async function GET(req: NextRequest) {
  const authOrResponse = await requireUserSession(req);
  if (authOrResponse instanceof NextResponse) {
    return authOrResponse;
  }

  const { user } = authOrResponse;
  const db = getApiDatabase();

  try {
    const rows = await db.query<VehicleWithQrRow>(
      `SELECT v.id, v.registration_number, v.vehicle_type, v.make, v.model, 
              v.year, v.color, v.status, v.created_at,
              q.public_code AS qr_public_code, q.status AS qr_status
       FROM vehicles v
       LEFT JOIN qr_stickers q ON q.vehicle_id = v.id AND q.status = 'ACTIVATED'
       WHERE v.user_id = ? AND v.status != 'DELETED'
       ORDER BY v.created_at DESC`,
      [user.id]
    );

    return NextResponse.json(
      {
        success: true,
        vehicles: rows.map((r) => ({
          id: r.id,
          registrationNumber: r.registration_number,
          type: r.vehicle_type,
          make: r.make,
          model: r.model,
          year: r.year,
          color: r.color,
          status: r.status,
          createdAt: r.created_at,
          qr: r.qr_public_code
            ? {
                publicCode: r.qr_public_code,
                status: r.qr_status,
                resolverUrl: `https://qr.vaahansafe.com/${r.qr_public_code}`,
              }
            : null,
        })),
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("[ApiVehiclesGet] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load vehicles", code: "ERR_LOAD_VEHICLES" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const authOrResponse = await requireUserSession(req);
  if (authOrResponse instanceof NextResponse) {
    return authOrResponse;
  }

  const { user } = authOrResponse;
  const body = await req.json().catch(() => ({}));

  const { registrationNumber, make, model, type, color, year } = body || {};

  if (!registrationNumber || !make || !model) {
    return NextResponse.json(
      {
        success: false,
        error: "Registration number, make, and model are required.",
        code: "ERR_VALIDATION",
      },
      { status: 400 }
    );
  }

  const normalized = String(registrationNumber).toUpperCase().replace(/[\s\-]/g, "");
  if (normalized.length < 4 || normalized.length > 15) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid vehicle registration plate format.",
        code: "ERR_INVALID_REG",
      },
      { status: 400 }
    );
  }

  const db = getApiDatabase();
  const vehicleRepo = getVehicleRepository(db);

  try {
    // Check if plate already registered under another active account
    const existing = await vehicleRepo.findByRegistration(normalized);
    if (existing && existing.customerId !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: "A vehicle with this registration plate is already registered.",
          code: "ERR_DUPLICATE_REGISTRATION",
        },
        { status: 409 }
      );
    }

    const vehicleId = existing?.id || `veh_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const saved = await vehicleRepo.save({
      id: vehicleId,
      customerId: user.id,
      registrationNumber: String(registrationNumber).toUpperCase().trim(),
      make: String(make).trim(),
      model: String(model).trim(),
      type: (type as any) || "CAR",
      primaryColor: color ? String(color).trim() : undefined,
      year: year ? Number(year) : undefined,
    });

    return NextResponse.json(
      {
        success: true,
        vehicle: saved,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[ApiVehiclesPost] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to register vehicle", code: "ERR_REGISTER_VEHICLE" },
      { status: 500 }
    );
  }
}

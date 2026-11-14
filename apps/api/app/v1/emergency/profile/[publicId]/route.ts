import { NextRequest, NextResponse } from "next/server";
import { resolvePublicEmergencyProfile } from "@vaahansafe/database";
import { isValidPublicIdFormat, isQrVehicleChoice, resolvePublicQr } from "@vaahansafe/qr-core";
import { getApiDatabase } from "../../../_db";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{
    publicId: string;
  }>;
}

/**
 * Public Emergency Profile Endpoint (GET /v1/emergency/profile/:publicId)
 *
 * Exposes privacy-safe emergency details (blood group, emergency contact priority labels,
 * vehicle make/model).
 * INVARIANT: Never leaks private phone numbers, home addresses, or billing records.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { publicId } = await params;
    const cleanPublicId = typeof publicId === "string" ? publicId.trim() : "";

    if (!cleanPublicId || !isValidPublicIdFormat(cleanPublicId)) {
      return NextResponse.json(
        { error: "Invalid QR public identifier format", code: "ERR_INVALID_PUBLIC_ID" },
        { status: 400 }
      );
    }

    const db = getApiDatabase();
    const choice = req.nextUrl.searchParams.get("vehicle");
    if (choice !== null && !isQrVehicleChoice(choice)) {
      return NextResponse.json({ error: "Invalid vehicle selection" }, { status: 400 });
    }
    const result = db.dialect === "postgres"
      ? await resolvePublicQr(cleanPublicId, { db, includeVehicleChoices: true, vehicleChoice: choice || undefined })
      : await resolvePublicEmergencyProfile(db, cleanPublicId);

    if (result.state === "UNKNOWN") {
      return NextResponse.json(
        { error: "Emergency profile not found for this QR identifier", code: "ERR_PROFILE_NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          state: result.state,
          publicId: result.publicId,
          visibleCode: result.visibleCode,
          replacedByPublicId: result.replacedByPublicId,
          vehicleChoices: "vehicleChoices" in result ? result.vehicleChoices : undefined,
          profile: result.profile && {
            ...result.profile,
            approvedEmergencyContacts: result.profile.approvedEmergencyContacts.map(({ phone: _phone, ...contact }) => contact),
          },
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
        },
      }
    );
  } catch (error) {
    console.error("[ApiEmergencyProfile] Query failed:", error);
    return NextResponse.json(
      { error: "Unable to retrieve emergency profile right now.", code: "ERR_PROFILE_LOOKUP_FAILED" },
      { status: 500 }
    );
  }
}

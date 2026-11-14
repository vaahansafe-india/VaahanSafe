import { NextRequest, NextResponse } from "next/server";
import { resolvePublicQr, isValidPublicIdFormat, isQrVehicleChoice } from "@vaahansafe/qr-core";
import { getApiDatabase } from "../../../_db";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{
    publicId: string;
  }>;
}

/**
 * Public QR Resolver Endpoint (GET /v1/qr/resolve/:publicId)
 *
 * Provides privacy-preserving public projection for scanned QR identifiers.
 * INVARIANT: Never exposes database primary keys, user account IDs, or phone numbers.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { publicId } = await params;
    const cleanPublicId = typeof publicId === "string" ? publicId.trim() : "";

    if (!cleanPublicId || !isValidPublicIdFormat(cleanPublicId)) {
      return NextResponse.json(
        {
          error: "Invalid QR public identifier format",
          code: "ERR_INVALID_PUBLIC_ID",
          status: "INVALID_FORMAT",
        },
        { status: 400 }
      );
    }

    const db = getApiDatabase();
    const choice = req.nextUrl.searchParams.get("vehicle");
    if (choice !== null && !isQrVehicleChoice(choice)) {
      return NextResponse.json({ error: "Invalid vehicle selection" }, { status: 400 });
    }
    const { qrId: _qrId, resolvedVehicleId: _vehicleId, ...resolution } = await resolvePublicQr(cleanPublicId, {
      db, includeVehicleChoices: true, vehicleChoice: choice || undefined,
    });

    if (resolution.state === "UNKNOWN") {
      return NextResponse.json(
        {
          error: "QR identifier not found in platform registry",
          code: "ERR_QR_NOT_FOUND",
          status: "NOT_FOUND",
          publicId: cleanPublicId,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: resolution,
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
    console.error("[ApiQrResolve] Error resolving public QR:", error);
    return NextResponse.json(
      {
        error: "Unable to resolve QR identifier right now. Please try again.",
        code: "ERR_RESOLVER_FAILED",
      },
      { status: 500 }
    );
  }
}

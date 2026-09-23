import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedCustomer } from "@/lib/session";
import { getDigitalQrData } from "@/lib/qr-service";
import { generatePlacardPdf } from "@/lib/pdf/generate-placard-pdf";
import { cleanText } from "@/lib/pdf/placard-copy";

export const dynamic = "force-dynamic";

/**
 * Server-authoritative endpoint to generate and stream the official
 * VaahanSafe Vehicle Safety Identity Placard PDF.
 *
 * Enforces:
 * 1. Authentication
 * 2. Vehicle ownership
 * 3. Authoritative entitlement verification
 * 4. Active QR sticker binding
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedCustomer();
    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to download placard." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const qrPublicId = searchParams.get("id") || undefined;

    // Authoritative data resolution & entitlement check
    const data = await getDigitalQrData(auth.user.id, qrPublicId);
    if (!data) {
      return NextResponse.json(
        {
          error:
            "No active safety identity or entitlement found for this vehicle.",
        },
        { status: 404 }
      );
    }

    // Generate the publication-grade vector PDF server-side
    const doc = await generatePlacardPdf(data);
    const pdfArrayBuffer = doc.output("arraybuffer");
    const cleanPlate = cleanText(data.vehicle.plate, "Vehicle").replace(
      /[^a-zA-Z0-9]/g,
      ""
    );

    return new NextResponse(pdfArrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="VaahanSafe-Vehicle-Safety-Identity-${cleanPlate}.pdf"`,
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (err: unknown) {
    console.error("[VaahanSafe API] Placard PDF generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate safety identity placard PDF." },
      { status: 500 }
    );
  }
}

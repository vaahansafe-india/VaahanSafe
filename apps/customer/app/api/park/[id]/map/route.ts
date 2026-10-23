import { NextRequest, NextResponse } from "next/server";
import { getParkingMapLocation } from "@/features/park/server";
import { parkingGoogleEmbedUrl } from "@/features/park/map-provider";
import { parkingMapZoom, parkingMapType } from "@/features/park/model";
import { PARK_HEADERS, parkFailure } from "@/features/park/http";
export const dynamic = "force-dynamic";
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const location = await getParkingMapLocation(id);
    const zoom = parkingMapZoom(request.nextUrl.searchParams.get("zoom"));
    const type = parkingMapType(request.nextUrl.searchParams.get("maptype"));
    const embedUrl = parkingGoogleEmbedUrl(location, zoom, type);
    return NextResponse.json(
      { embedUrl },
      {
        headers: {
          ...PARK_HEADERS,
          "Cross-Origin-Resource-Policy": "same-origin",
        },
      },
    );
  } catch (error) {
    return parkFailure(error);
  }
}

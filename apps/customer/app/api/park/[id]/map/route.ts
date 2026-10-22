import { NextRequest, NextResponse } from "next/server";
import { getParkingMapLocation } from "@/features/park/server";
import { fetchParkingMap } from "@/features/park/map-provider";
import { parkingMapZoom } from "@/features/park/model";
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
    const image = await fetchParkingMap(location, zoom);
    return new NextResponse(image, {
      headers: {
        ...PARK_HEADERS,
        "Content-Type": "image/png",
        "Cross-Origin-Resource-Policy": "same-origin",
      },
    });
  } catch (error) {
    return parkFailure(error);
  }
}

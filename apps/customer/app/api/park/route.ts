import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { getParkingData, startParking } from "@/features/park/server";
import { ParkError } from "@/features/park/model";
import {
  PARK_HEADERS as headers,
  parkFailure,
  validParkOrigin,
  readParkingInput,
} from "@/features/park/http";
import { enrichParkLocation } from "@/features/park/location";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return NextResponse.json(await getParkingData(), { headers });
  } catch (e) {
    return parkFailure(e);
  }
}
export async function POST(req: NextRequest) {
  try {
    if (!validParkOrigin(req))
      return NextResponse.json(
        { error: "This request could not be verified." },
        { status: 403, headers },
      );
    if (!req.headers.get("content-type")?.startsWith("application/json"))
      throw new ParkError("INVALID_INPUT");
    const input = await readParkingInput(req);
    const session = await startParking(input);
    after(async () => {
      await enrichParkLocation(session).catch(() =>
        console.warn("[Park] Place name unavailable"),
      );
    });
    return NextResponse.json({ session }, { status: 201, headers });
  } catch (e) {
    return parkFailure(e);
  }
}

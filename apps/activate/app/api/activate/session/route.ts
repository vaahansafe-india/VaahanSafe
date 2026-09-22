import { NextResponse } from "next/server";
import { getActivationSession } from "@/lib/activation-service";

export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get("cookie");
    const sessionData = await getActivationSession(cookieHeader);

    return NextResponse.json(sessionData, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (err) {
    console.error("[VaahanSafe Activate] Session error:", err);
    return NextResponse.json(
      {
        stage: "RECOGNIZE",
        challenge: null,
        user: null,
        eligibleVehiclesCount: 0,
      },
      { status: 500 }
    );
  }
}

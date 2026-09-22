import { NextResponse } from "next/server";
import { getEligibleVehicles } from "@/lib/activation-service";
import { parseSessionCookie, validateSessionToken } from "@vaahansafe/auth";
import { getSessionRepository, getVehicleRepository } from "@vaahansafe/database";
import { vehicleRegistrationSchema } from "@vaahansafe/validation";

export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get("cookie");
    const rawSessionToken = parseSessionCookie(cookieHeader);

    if (!rawSessionToken) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const sessionRepo = getSessionRepository();
    const activeSession = await validateSessionToken(rawSessionToken, sessionRepo);
    if (!activeSession) {
      return NextResponse.json({ error: "Invalid or expired session." }, { status: 401 });
    }

    const vehicles = await getEligibleVehicles(activeSession.userId);
    return NextResponse.json({ vehicles });
  } catch (err) {
    console.error("[VaahanSafe Activate] Get vehicles error:", err);
    return NextResponse.json(
      { error: "Failed to retrieve account vehicles." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const cookieHeader = req.headers.get("cookie");
    const rawSessionToken = parseSessionCookie(cookieHeader);

    if (!rawSessionToken) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const sessionRepo = getSessionRepository();
    const activeSession = await validateSessionToken(rawSessionToken, sessionRepo);
    if (!activeSession) {
      return NextResponse.json({ error: "Invalid or expired session." }, { status: 401 });
    }

    const body = await req.json();
    const rawReg = body?.registrationNumber;
    const make = body?.make?.trim();
    const model = body?.model?.trim();
    const vehicleType = body?.vehicleType === "TWO_WHEELER" || body?.vehicleType === "MOTORCYCLE"
      ? "MOTORCYCLE"
      : "CAR";
    const primaryColor = body?.primaryColor?.trim() || undefined;

    if (!rawReg || !make || !model) {
      return NextResponse.json(
        { error: "Registration number, make, and model are required." },
        { status: 400 }
      );
    }

    // Validate registration format
    const parsedReg = vehicleRegistrationSchema.safeParse(rawReg);
    if (!parsedReg.success) {
      return NextResponse.json(
        { error: "Please enter a valid Indian vehicle registration number (e.g. DL 01 AB 1234)." },
        { status: 400 }
      );
    }

    const vehicleRepo = getVehicleRepository();
    const vehicleId = `veh_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;

    const savedVehicle = await vehicleRepo.save({
      id: vehicleId,
      customerId: activeSession.userId,
      registrationNumber: parsedReg.data,
      make,
      model,
      type: vehicleType,
      primaryColor,
    });

    const reg = savedVehicle.registrationNumber || "";
    const masked =
      reg.length >= 6
        ? `${reg.slice(0, 4)} •••• ${reg.slice(-4)}`
        : reg;

    return NextResponse.json({
      success: true,
      vehicle: {
        id: savedVehicle.id,
        registrationNumber: savedVehicle.registrationNumber,
        maskedRegistration: masked,
        make: savedVehicle.make,
        model: savedVehicle.model,
        vehicleType: savedVehicle.type,
        primaryColor: savedVehicle.primaryColor,
        hasActiveQr: false,
      },
    });
  } catch (err) {
    console.error("[VaahanSafe Activate] Create vehicle error:", err);
    return NextResponse.json(
      { error: "Failed to register vehicle. Please try again." },
      { status: 500 }
    );
  }
}

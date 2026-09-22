import { NextResponse } from "next/server";
import { phoneSchema } from "@vaahansafe/validation";
import { Msg91OtpAdapter } from "@vaahansafe/notifications";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawPhone = body?.phone;

    if (!rawPhone || typeof rawPhone !== "string") {
      return NextResponse.json(
        { success: false, error: "Mobile number is required." },
        { status: 400 }
      );
    }

    const parsedResult = phoneSchema.safeParse(rawPhone);
    if (!parsedResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Please enter a valid 10-digit Indian mobile number.",
        },
        { status: 400 }
      );
    }

    const tenDigitPhone = parsedResult.data;
    const normalizedE164 = `+91${tenDigitPhone}`;

    const otpService = new Msg91OtpAdapter();
    const sendResult = await otpService.send({
      phone: normalizedE164,
      otpLength: 6,
    });

    if (!sendResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "We couldn't send a verification code right now. Please try again.",
        },
        { status: 500 }
      );
    }

    const maskedPhone = `+91 ••••• ${tenDigitPhone.slice(-4)}`;

    return NextResponse.json({
      success: true,
      requestId: sendResult.requestId,
      maskedPhone,
    });
  } catch (err) {
    console.error("[VaahanSafe Activate] Send OTP error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "We couldn't complete verification right now. Please try again.",
      },
      { status: 500 }
    );
  }
}

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

    // Validate phone number
    const parsedResult = phoneSchema.safeParse(rawPhone);
    if (!parsedResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "We couldn't use that mobile number. Check it and try again.",
        },
        { status: 400 }
      );
    }

    const tenDigitPhone = parsedResult.data;
    const normalizedE164 = `+91${tenDigitPhone}`;

    // Send OTP via notification pipeline
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
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "We couldn't complete sign-in right now. Please try again.",
      },
      { status: 500 }
    );
  }
}

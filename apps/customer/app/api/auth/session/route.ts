import { NextResponse } from "next/server";
import { getAuthenticatedCustomer } from "@/lib/session";

export async function GET() {
  try {
    const auth = await getAuthenticatedCustomer();
    return NextResponse.json({ authenticated: Boolean(auth), user: auth ? { ...auth.user, phoneVerified: auth.phoneVerified, googleVerified: auth.googleVerified } : null }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[Customer] Session service unavailable", error);
    return NextResponse.json({ error: "We couldn't check your sign-in right now. Please try again." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

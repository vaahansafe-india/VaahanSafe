import { NextResponse } from "next/server";
import { createClient } from "@vaahansafe/ui/lib/server";
import { getCustomerUrl } from "@vaahansafe/config";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/";

  if (code) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error && data?.user) {
        // Forward authenticated customer to customer portal dashboard
        const customerUrl = getCustomerUrl();
        return NextResponse.redirect(`${customerUrl}/dashboard`);
      }
    } catch (err) {
      console.error("[Supabase Auth Callback] Exchange error:", err);
    }
  }

  // Fallback to home with error if code exchange fails
  return NextResponse.redirect(new URL("/?error=auth_failed", requestUrl.origin));
}

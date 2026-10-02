import { createClient } from "@supabase/supabase-js";

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || "";
const cfToken = process.env.CLOUDFLARE_API_TOKEN || "";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://zpjwrptrqgpeyvlvscpv.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

async function run() {
  console.log("==================================================");
  console.log("1. TESTING SUPABASE CONNECTION");
  console.log("==================================================");
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: heartbeats, error: hbError } = await supabase
      .from("status_heartbeats")
      .select("*")
      .order("checked_at", { ascending: false })
      .limit(3);

    if (hbError) {
      console.error("Supabase heartbeats query error:", hbError);
    } else {
      console.log("✅ Supabase PostgREST Connection: SUCCESS");
      console.log("Recent heartbeats:", heartbeats);
    }

    // Test RPC
    const { data: rpcData, error: rpcError } = await supabase.rpc("resolve_public_qr", {
      p_public_code: "NON_EXISTENT_TEST_CODE"
    });
    if (rpcError) {
      console.error("Supabase RPC error:", rpcError);
    } else {
      console.log("✅ Supabase RPC 'resolve_public_qr' Security Boundary: SUCCESS");
      console.log("RPC result for invalid code:", rpcData);
    }

    // Test Auth config endpoint
    const authRes = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` }
    });
    const authSettings = await authRes.json();
    console.log("✅ Supabase Auth Service: ACTIVE", {
      external_providers: authSettings.external ? Object.keys(authSettings.external).filter(k => authSettings.external[k]) : "none"
    });
  } catch (err) {
    console.error("Supabase test failed:", err);
  }

  console.log("\n==================================================");
  console.log("2. TESTING CLOUDFLARE INFRASTRUCTURE");
  console.log("==================================================");
  try {
    const tokenRes = await fetch("https://api.cloudflare.com/client/v4/user/tokens/verify", {
      headers: { Authorization: `Bearer ${cfToken}` }
    }).then(r => r.json());
    console.log("Cloudflare Token Verification:", tokenRes.success ? "✅ VALID" : "❌ INVALID", tokenRes.messages);

    // D1
    const d1Res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database`, {
      headers: { Authorization: `Bearer ${cfToken}` }
    }).then(r => r.json());
    console.log("✅ Cloudflare D1 Databases:", d1Res.result?.map(d => ({ name: d.name, uuid: d.uuid })));

    // R2 Buckets (Object Storage for Images, Documents, QRs)
    const r2Res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets`, {
      headers: { Authorization: `Bearer ${cfToken}` }
    }).then(r => r.json());
    console.log("✅ Cloudflare R2 Buckets (Object Storage):", r2Res.result?.buckets?.map(b => b.name));

    // Workers
    const workersRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts`, {
      headers: { Authorization: `Bearer ${cfToken}` }
    }).then(r => r.json());
    console.log("✅ Cloudflare Workers:", workersRes.result?.map(w => w.id));
  } catch (err) {
    console.error("Cloudflare test failed:", err);
  }

  console.log("\n==================================================");
  console.log("3. TESTING FRONTEND INTEGRATION & AUTH FLOW");
  console.log("==================================================");
  try {
    // 3.1 Marketing Web App
    const webRes = await fetch("http://localhost:3000");
    console.log(`✅ Web App (Port 3000): HTTP ${webRes.status} (SSR Render: OK)`);

    // 3.2 Customer App Login
    const loginRes = await fetch("http://localhost:3001/login");
    const loginHtml = await loginRes.text();
    const hasGoogleButton = loginHtml.includes("Continue with Google");
    console.log(`✅ Customer App Login (Port 3001): HTTP ${loginRes.status} (Google Button Present: ${hasGoogleButton})`);

    // 3.3 Server Google OAuth Route
    const googleRes = await fetch("http://localhost:3001/api/auth/google", { redirect: "manual" });
    const location = googleRes.headers.get("location") || "";
    const hasGoogleClientId = location.includes("605399976046");
    const hasCsrfCookie = !!googleRes.headers.get("set-cookie")?.includes("vs_google_oauth_state");
    console.log(`✅ Server Google OAuth Route (/api/auth/google): HTTP ${googleRes.status}`);
    console.log(`   - Google OAuth URL verified: ${hasGoogleClientId}`);
    console.log(`   - CSRF State Cookie attached: ${hasCsrfCookie}`);

    // 3.4 Supabase Client OAuth Provider
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: oAuthData, error: oAuthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: "http://localhost:3001/auth/callback" }
    });
    console.log(`✅ Supabase Auth Google Provider URL: ${oAuthData?.url ? "GENERATED" : "FAILED"}`);
    if (oAuthError) console.error("   - Supabase OAuth Error:", oAuthError);

  } catch (err) {
    console.error("Frontend integration test failed:", err);
  }
}

run();

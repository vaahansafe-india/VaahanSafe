const origin = "http://localhost:3001";
for (const path of ["/api/auth/google?returnUrl=%2Fvehicles", "/auth/callback", "/dashboard", "/onboarding/verification", "/api/auth/session"]) {
  const response = await fetch(origin + path, { redirect: "manual" });
  const location = response.headers.get("location");
  const target = location ? new URL(location, origin) : null;
  console.log(path, { status: response.status, targetHost: target?.host, targetPath: target?.pathname,
    ...(path.startsWith("/api/auth/google") ? { pkceCookie: response.headers.getSetCookie().some(cookie => cookie.includes("code-verifier")), returnCookie: response.headers.getSetCookie().some(cookie => cookie.startsWith("vs_google_return=") && cookie.includes("HttpOnly")), callback: target?.searchParams.get("redirect_to") } : {}),
  });
}
const response = await fetch(origin + "/api/auth/send-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: "invalid" }) });
console.log("Invalid phone rejected", { status: response.status, success: (await response.json()).success });

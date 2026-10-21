/** Domain-separated HMAC tokens stay out of database payloads and request URLs. */
export async function reportViewToken(intentId: string, secret: string) {
  if (secret.length < 32 || !intentId)
    throw new Error("Report link configuration unavailable");
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = new Uint8Array(
    await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(`vaahansafe:report-view:v1:${intentId}`),
    ),
  );
  const token = btoa(String.fromCharCode(...signature))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(token));
  const hash = Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
  return { token, hash };
}

type ChallengeOptions = {
  token: unknown;
  secret: string;
  requestHostname: string;
  hostnames: string;
  production: boolean;
};

/** Verify with Cloudflare before any report, upload or notification work. */
export async function verifyScanReportTurnstile(
  options: ChallengeOptions,
): Promise<boolean> {
  const expectedHostnames = new Set(
    options.hostnames
      .split(",")
      .map((hostname) => hostname.trim().toLowerCase())
      .filter(Boolean),
  );
  const isLocal = (hostname: string) =>
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    /^127\./.test(hostname) ||
    hostname === "0.0.0.0" ||
    hostname === "::1" ||
    hostname === "[::1]";
  if (
    typeof options.token !== "string" ||
    !options.token.trim() ||
    options.token.length > 2048 ||
    !options.secret ||
    !expectedHostnames.size ||
    !expectedHostnames.has(options.requestHostname.toLowerCase()) ||
    (options.production && [...expectedHostnames].some(isLocal))
  )
    return false;
  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: options.secret,
          response: options.token,
        }),
        signal: AbortSignal.timeout(8000),
        cache: "no-store",
      },
    );
    if (!response.ok) return false;
    const challenge: unknown = await response.json();
    if (!challenge || typeof challenge !== "object") return false;
    const result = challenge as Record<string, unknown>;
    return (
      result.success === true &&
      result.action === "scan-report" &&
      result.hostname === options.requestHostname.toLowerCase() &&
      typeof result.hostname === "string" &&
      expectedHostnames.has(result.hostname)
    );
  } catch {
    return false;
  }
}

/** Only permit destinations inside the customer app. */
export function safeReturnUrl(value?: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\r\n]/.test(value)) return "/dashboard";
  const parsed = new URL(value, "https://app.vaahansafe.com");
  if (parsed.origin !== "https://app.vaahansafe.com" || /^\/(login|auth|api|onboarding)(\/|$)/.test(parsed.pathname)) return "/dashboard";
  return parsed.pathname === "/" ? "/dashboard" : parsed.pathname + parsed.search + parsed.hash;
}

/** Development follows the local request; deployed auth follows the configured app. */
export function customerAuthOrigin(requestUrl: string, mode = process.env.NODE_ENV): string {
  const requestOrigin = new URL(requestUrl).origin;
  if (mode === "development") return requestOrigin;
  if (process.env.NEXT_PUBLIC_APP_URL) return new URL(process.env.NEXT_PUBLIC_APP_URL).origin;
  if (requestOrigin && !requestOrigin.includes("localhost") && !requestOrigin.includes("127.0.0.1")) {
    return requestOrigin;
  }
  return "https://app.vaahansafe.com";
}

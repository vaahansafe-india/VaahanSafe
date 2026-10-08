// Email normalization must never trim or otherwise transform the password.
export const ADMIN_EMAIL_DOMAIN = "vaahansafe.com";
export function isAdminWorkEmail(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length <= 254 &&
    /^[^\s@]+@vaahansafe\.com$/i.test(value.trim())
  );
}
export function adminCredentials(
  body: unknown,
): { email: string; password: string } | null {
  if (!body || typeof body !== "object") return null;
  const { email, password } = body as Record<string, unknown>;
  if (typeof email !== "string" || typeof password !== "string") return null;
  const normalized = email.trim().toLowerCase();
  if (
    !isAdminWorkEmail(normalized) ||
    password.length < 1 ||
    password.length > 128
  )
    return null;
  return { email: normalized, password };
}

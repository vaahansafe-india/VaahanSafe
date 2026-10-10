export async function vaultRequest<T = Record<string, unknown>>(
  action: string,
  data: Record<string, unknown> = {},
): Promise<T> {
  const response = await fetch("/api/documents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...data }),
    cache: "no-store",
  });
  const body = await response.json();
  if (!response.ok)
    throw Object.assign(new Error(body.error || "Please try again."), {
      code: body.code,
      scope: body.scope,
    });
  return body;
}

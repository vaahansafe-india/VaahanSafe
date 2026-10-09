export async function getAdminData<T>(
  url: string,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(url, {
    cache: "no-store",
    credentials: "same-origin",
    signal,
  });
  const result = await response.json();
  if (!response.ok || !result.success)
    throw Object.assign(
      new Error(
        result.error?.message ||
          "We couldn't load this workspace. Please try again.",
      ),
      { code: result.error?.code },
    );
  return result.data as T;
}

export async function mutateNetwork(
  url: string,
  body: unknown,
  method = "POST",
) {
  let response: Response;
  let result;
  try {
    response = await fetch(url, {
      method,
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    result = await response.json();
  } catch {
    throw new Error(
      "We couldn't complete this action right now. Please try again.",
    );
  }
  if (!response.ok || !result.success)
    throw Object.assign(
      new Error(
        result.error?.message ||
          "We couldn't save this change. Please try again.",
      ),
      { code: result.error?.code },
    );
  return result.data;
}

import { NextRequest, NextResponse } from "next/server";
import { ParkError, PARK_MESSAGES } from "./model";
export const PARK_HEADERS = {
  "Cache-Control": "private, no-store",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
};
export function parkFailure(error: unknown) {
  const e =
    error instanceof ParkError
      ? error
      : new ParkError("SERVICE_UNAVAILABLE", 503);
  if (e.status >= 500) console.warn("[Park] Service unavailable");
  return NextResponse.json(
    {
      code: e.code,
      error: PARK_MESSAGES[e.code] || PARK_MESSAGES.SERVICE_UNAVAILABLE,
    },
    { status: e.status, headers: PARK_HEADERS },
  );
}
export function validParkOrigin(req: NextRequest) {
  return req.headers.get("origin") === req.nextUrl.origin;
}
export async function readParkingInput(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new ParkError("INVALID_INPUT");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 4096) {
      await reader.cancel();
      throw new ParkError("INVALID_INPUT");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new ParkError("INVALID_INPUT");
  }
}

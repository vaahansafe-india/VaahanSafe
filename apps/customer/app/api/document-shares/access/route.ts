import { NextRequest, NextResponse } from "next/server";
import {
  shareCommand,
  VaultError,
  vaultError,
  readVaultJson,
} from "@/features/document-vault/server";
export const runtime = "nodejs";
const headers = {
  "Cache-Control": "private, no-store",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
};
export async function POST(req: NextRequest) {
  try {
    if (req.headers.get("origin") !== req.nextUrl.origin)
      throw new VaultError("INVALID_ORIGIN", 403);
    const body = await readVaultJson(req, 4096);
    return NextResponse.json(await shareCommand(body), { headers });
  } catch (error) {
    return NextResponse.json(vaultError(error), {
      status: error instanceof VaultError ? error.status : 503,
      headers,
    });
  }
}

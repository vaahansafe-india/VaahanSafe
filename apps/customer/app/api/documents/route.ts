import { NextRequest, NextResponse } from "next/server";
import {
  command,
  listDocuments,
  VaultError,
  vaultError,
  readVaultJson,
} from "@/features/document-vault/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
};
export async function GET(req: NextRequest) {
  try {
    return NextResponse.json(await listDocuments(req.nextUrl.searchParams), {
      headers,
    });
  } catch (error) {
    return NextResponse.json(vaultError(error), {
      status: error instanceof VaultError ? error.status : 503,
      headers,
    });
  }
}
export async function POST(req: NextRequest) {
  try {
    if (req.headers.get("origin") !== req.nextUrl.origin)
      throw new VaultError("INVALID_ORIGIN", 403);
    const body = await readVaultJson(req, 16384);
    return NextResponse.json(await command(String(body.action), body), {
      headers,
    });
  } catch (error) {
    return NextResponse.json(vaultError(error), {
      status: error instanceof VaultError ? error.status : 503,
      headers,
    });
  }
}

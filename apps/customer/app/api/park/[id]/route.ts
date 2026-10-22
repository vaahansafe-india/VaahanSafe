import { NextRequest, NextResponse } from "next/server";
import { changeParking } from "@/features/park/server";
import { parkFailure, validParkOrigin } from "@/features/park/http";
const headers = {
  "Cache-Control": "private, no-store",
  "Referrer-Policy": "no-referrer",
};
async function mutate(
  req: NextRequest,
  params: Promise<{ id: string }>,
  action: "end" | "delete",
) {
  if (!validParkOrigin(req))
    return NextResponse.json(
      { error: "This request could not be verified." },
      { status: 403, headers },
    );
  try {
    await changeParking((await params).id, action);
    return NextResponse.json({ ok: true }, { headers });
  } catch (e) {
    return parkFailure(e);
  }
}
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  return mutate(req, ctx.params, "end");
}
export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  return mutate(req, ctx.params, "delete");
}

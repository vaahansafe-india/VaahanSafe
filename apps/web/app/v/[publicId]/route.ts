import { NextResponse } from "next/server";
import { getQrUrl } from "@vaahansafe/config";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ publicId: string }> },
) {
  const { publicId } = await params;
  if (!/^VS-[A-Z0-9]{8}$/.test(publicId))
    return new NextResponse("QR identity not recognized.", { status: 404 });
  // Only a public locator is redirected; the resolver still authorizes all services.
  return NextResponse.redirect(getQrUrl(publicId.slice(3)), 308);
}

import { NextRequest, NextResponse } from "next/server";
import { isDiscoveryPath } from "@vaahansafe/config";
export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (
    path === "/login" ||
    path.startsWith("/api/") ||
    path === "/auth/callback" ||
    isDiscoveryPath(path)
  )
    return NextResponse.next();
  // Fast redirect only. Every protected page and API still verifies the
  // revocable database session and current role independently on the server.
  if (!request.cookies.get("vs_admin_session")?.value)
    return NextResponse.redirect(new URL("/login", request.url));
  return NextResponse.next();
}
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|images/|fonts/|favicon\\.ico|favicon\\.svg|icon\\.svg|apple-touch-icon\\.png).*)",
  ],
};

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { CUSTOMER_SESSION_COOKIE_NAME } from "@vaahansafe/auth";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static assets and internal next paths are bypassed
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/images") ||
    pathname.match(/\.(png|jpg|jpeg|svg|webp|ico|txt)$/) ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt"
  ) {
    return NextResponse.next();
  }

  const sessionToken = request.cookies.get(CUSTOMER_SESSION_COOKIE_NAME)?.value;

  // The login route is always accessible; validity is verified authoritatively by the page
  if (pathname === "/login") {
    return NextResponse.next();
  }

  // All other pages require an authenticated session
  if (!sessionToken) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("returnUrl", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api/auth (authentication endpoints)
     * 2. /_next/static (static files)
     * 3. /_next/image (image optimization files)
     * 4. /images (product and marketing assets)
     * 5. /favicon.ico, /robots.txt, static files (*.jpg, *.png, etc.)
     */
    "/((?!api/auth|_next/static|_next/image|images|favicon.ico|robots.txt|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)",
  ],
};

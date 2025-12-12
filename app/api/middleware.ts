import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;

  // Protect admin dashboard
  if (req.nextUrl.pathname.startsWith("/admin") && !token) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  // Protect admin API
  if (req.nextUrl.pathname.startsWith("/api/admin") && !token) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Allow everything else (public user)
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "../lib/auth";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("vk_token")?.value || null;

  const publicPaths = ["/login", "/", "/api/auth/login"];

  if (publicPaths.includes(req.nextUrl.pathname)) {
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // ADMIN ONLY PAGES
  if (req.nextUrl.pathname.startsWith("/admin")) {
    if (payload.role !== "admin") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // USER ONLY PAGES
  if (req.nextUrl.pathname.startsWith("/user")) {
    if (payload.role !== "user" && payload.role !== "admin") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/user/:path*", "/login", "/"]
};

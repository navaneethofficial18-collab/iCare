import { NextResponse, NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";
import { AUTH_COOKIE_NAME } from "@/lib/auth-cookie";

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isApiRoute = path.startsWith("/api/");
  const isPublicRoute = path === "/" || path.startsWith("/login") || path.startsWith("/api/auth");

  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  const decoded = token ? await verifyToken(token) : null;

  if (!isPublicRoute && !decoded) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isPublicRoute && decoded && path.startsWith("/login")) {
    if (decoded.role !== "admin") {
        const res = NextResponse.next();
        res.cookies.delete(AUTH_COOKIE_NAME);
        return res;
    }
    return NextResponse.redirect(new URL("/dashboard/admin", req.url));
  }

  if (path.startsWith("/dashboard") && decoded?.role !== "admin") {
    if (isApiRoute) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.delete(AUTH_COOKIE_NAME);
    return res;
  }

  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };

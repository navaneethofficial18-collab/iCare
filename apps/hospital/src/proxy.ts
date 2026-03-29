import { NextResponse, NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isPublicRoute = path === "/" || path.startsWith("/login") || path.startsWith("/register") || path.startsWith("/api/auth");

  const token = req.cookies.get("jwt")?.value;
  const decoded = token ? await verifyToken(token) : null;

  if (!isPublicRoute && !decoded) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isPublicRoute && decoded && (path.startsWith("/login") || path.startsWith("/register"))) {
    if (decoded.role !== "hospital") {
        const res = NextResponse.next();
        res.cookies.delete("jwt");
        return res;
    }
    return NextResponse.redirect(new URL("/dashboard/hospital", req.url));
  }

  if (path.startsWith("/dashboard") && decoded?.role !== "hospital") {
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.delete("jwt");
    return res;
  }

  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };

import { NextResponse, NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isApiRoute = path.startsWith("/api/");
  const isPublicRoute =
    path === "/" ||
    path.startsWith("/login") ||
    path.startsWith("/register") ||
    path.startsWith("/forgot-password") ||
    path.startsWith("/reset-password") ||
    path.startsWith("/api/auth");

  const token = req.cookies.get("jwt")?.value;
  const decoded = token ? await verifyToken(token) : null;

  if (!isPublicRoute && !decoded) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isPublicRoute && decoded && (path.startsWith("/login") || path.startsWith("/register"))) {
    // If they have the wrong role on this port, clear it
    if (decoded.role !== "patient") {
        const res = NextResponse.next();
        res.cookies.delete("jwt");
        return res;
    }
    return NextResponse.redirect(new URL("/dashboard/patient", req.url));
  }

  if (path.startsWith("/dashboard") && decoded?.role !== "patient") {
    // Colliding cookie from another port - clear and force login
    if (isApiRoute) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.delete("jwt");
    return res;
  }

  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };

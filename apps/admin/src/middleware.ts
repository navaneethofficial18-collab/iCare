import { NextResponse, NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";
import { AUTH_COOKIE_NAME } from "@/lib/auth-cookie";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

const ratelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "10s"), // 20 requests per 10 seconds for admin
      analytics: true,
    })
  : null;

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isApiRoute = path.startsWith("/api/");

  if (isApiRoute && ratelimit) {
    const ip = req.headers.get("x-forwarded-for") ?? req.ip ?? "127.0.0.1";
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
  }

  const isPublicRoute =
    path === "/" ||
    path.startsWith("/login") ||
    path.startsWith("/register") ||
    path.startsWith("/forgot-password") ||
    path.startsWith("/reset-password") ||
    path.startsWith("/api/auth");

  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  const decoded = (token ? await verifyToken(token) : null) as any;

  const isAuthorized = decoded && decoded.sub && decoded.type === "access";

  if (!isPublicRoute && !isAuthorized) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isPublicRoute && isAuthorized && (path.startsWith("/login") || path.startsWith("/register"))) {
    if (decoded.role !== "admin") {
      console.error("Middleware Auth Error: Role mismatch", { expected: "admin", actual: decoded.role });
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
    console.error("Middleware Auth Error: Invalid session for dashboard", { isAuthorized, role: decoded?.role });
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.delete(AUTH_COOKIE_NAME);
    return res;
  }

  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };

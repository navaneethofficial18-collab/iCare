$ErrorActionPreference = "Stop"

# 1. Update DB_HOST to 127.0.0.1 in all env files to fix Node.js IPv6 resolution ECONNREFUSED
$envFiles = @("apps\patient\.env", "apps\hospital\.env", "apps\admin\.env", "packages\db\.env", ".env")
foreach ($file in $envFiles) {
    if (Test-Path $file) {
        $content = Get-Content -Path $file -Raw
        $content = $content -replace "DB_HOST=localhost", "DB_HOST=127.0.0.1"
        Set-Content -Path $file -Value $content
        Write-Host "Patched $file"
    }
}

# 2. Patch patient proxy.ts to delete colliding cookies instead of 404
$patientProxy = @"
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
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.delete("jwt");
    return res;
  }

  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
"@
Set-Content -Path "apps\patient\src\proxy.ts" -Value $patientProxy

# 3. Patch hospital proxy.ts
$hospitalProxy = @"
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
"@
Set-Content -Path "apps\hospital\src\proxy.ts" -Value $hospitalProxy

# 4. Patch admin proxy.ts
$adminProxy = @"
import { NextResponse, NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isPublicRoute = path === "/" || path.startsWith("/login") || path.startsWith("/api/auth");

  const token = req.cookies.get("jwt")?.value;
  const decoded = token ? await verifyToken(token) : null;

  if (!isPublicRoute && !decoded) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isPublicRoute && decoded && path.startsWith("/login")) {
    if (decoded.role !== "admin") {
        const res = NextResponse.next();
        res.cookies.delete("jwt");
        return res;
    }
    return NextResponse.redirect(new URL("/dashboard/admin", req.url));
  }

  if (path.startsWith("/dashboard") && decoded?.role !== "admin") {
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.delete("jwt");
    return res;
  }

  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
"@
Set-Content -Path "apps\admin\src\proxy.ts" -Value $adminProxy

Write-Host "Fixes deployed."

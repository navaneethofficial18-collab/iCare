import { NextResponse, NextRequest } from "next/server";
import { verifyToken, signAccessToken } from "@/lib/auth";
import { db } from "@/db";
import { usersTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { AUTH_COOKIE_NAME } from "@/lib/auth-cookie";

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get("refresh_token")?.value;
  if (!refreshToken) return NextResponse.json({ error: "No refresh token provided" }, { status: 401 });

  const decoded = await verifyToken(refreshToken);
  if (!decoded || !decoded.sub || decoded.type !== "refresh") {
    return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 });
  }

  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, decoded.sub as string)).limit(1);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const accessToken = await signAccessToken({ sub: user.id, role: user.role, email: user.email });

    const response = NextResponse.json({ message: "Token refreshed" });
    response.cookies.set(AUTH_COOKIE_NAME, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60, // 15 minutes
      path: "/",
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

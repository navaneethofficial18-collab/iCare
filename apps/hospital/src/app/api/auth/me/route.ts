import { NextResponse, NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";
import { db } from "@/db";
import { usersTable, patientsTable, hospitalsTable, doctorsTable } from "@/db/schema";
import { eq } from "drizzle-orm";

import { AUTH_COOKIE_NAME } from "@/lib/auth-cookie";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const decoded = await verifyToken(token);
  if (!decoded || !decoded.sub || decoded.type !== "access") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, decoded.sub as string)).limit(1);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    let profile = null;
    if (user.role === "patient") {
      const pResult = await db.select().from(patientsTable).where(eq(patientsTable.userId, user.id)).limit(1);
      profile = pResult[0];
    } else if (user.role === "hospital") {
      const hResult = await db.select().from(hospitalsTable).where(eq(hospitalsTable.userId, user.id)).limit(1);
      profile = hResult[0];
    } else if (user.role === "doctor") {
      const dResult = await db.select().from(doctorsTable).where(eq(doctorsTable.userId, user.id)).limit(1);
      profile = dResult[0];
    }

    return NextResponse.json({ user: { id: user.id, email: user.email, role: user.role, profile } });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

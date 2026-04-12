import { NextResponse } from "next/server";
Dimport { db, ensureAdminUser } from "@/db";
import { usersTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { signToken } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function POST(req: Request, { params }: { params: Promise<{ role: string }> }) {
  try {
    const p = await params;
    const { role } = p;

    if (!["patient", "hospital", "admin"].includes(role)) {
      return NextResponse.json({ error: "Invalid role specified in URL" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
    }

    const { email, password } = parsed.data;

    if (role === "admin") {
      await ensureAdminUser({
        email: process.env.ADMIN_REFERENCE_ID,
        password: process.env.ADMIN_PASSCODE,
      });
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user || user.role !== role) {
      return NextResponse.json({ error: "Invalid credentials or role mismatch" }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = await signToken({ sub: user.id, role: user.role, email: user.email });

    const response = NextResponse.json({ message: "Login successful", role: user.role });
    response.cookies.set("jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { db } from "@/db";
import { hospitalInvitesTable, usersTable } from "@/db/schema";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { eq } from "drizzle-orm";
import { sendHospitalInviteEmail } from "@/lib/email";
import { AUTH_COOKIE_NAME } from "@/lib/auth-cookie";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return false;

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "caresync_super_secret_key");
    const { payload } = await jwtVerify(token, secret);
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

    const normalizedEmail = String(email).trim().toLowerCase();
    const [existingUser] = await db.select().from(usersTable).where(eq(usersTable.email, normalizedEmail)).limit(1);

    if (existingUser) {
      return NextResponse.json({ error: "This email is already registered in CareSync." }, { status: 409 });
    }

    const [existing] = await db.select().from(hospitalInvitesTable).where(eq(hospitalInvitesTable.email, normalizedEmail)).limit(1);
    
    if (existing && existing.status === "pending") {
      await sendHospitalInviteEmail(normalizedEmail, existing.token);
      return NextResponse.json({ message: "Invite resent successfully", token: existing.token }, { status: 200 });
    }

    if (existing && existing.status === "accepted") {
      return NextResponse.json({ error: "This hospital invitation has already been accepted." }, { status: 409 });
    }

    const token = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
    
    await db.insert(hospitalInvitesTable).values({
      id: crypto.randomUUID(),
      email: normalizedEmail,
      token,
      status: "pending"
    });

    await sendHospitalInviteEmail(normalizedEmail, token);

    return NextResponse.json({ message: "Invite generated successfully", token }, { status: 201 });
  } catch (error) {
    console.error("Invite generation failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const invites = await db.select({
      id: hospitalInvitesTable.id,
      email: hospitalInvitesTable.email,
      token: hospitalInvitesTable.token,
      status: hospitalInvitesTable.status,
      createdAt: hospitalInvitesTable.createdAt
    }).from(hospitalInvitesTable);

    return NextResponse.json(invites);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

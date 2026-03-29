import { NextResponse } from "next/server";
import { db } from "@/db";
import { hospitalInvitesTable } from "@/db/schema";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { eq } from "drizzle-orm";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("jwt")?.value;
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

    // Check if invite exists
    const [existing] = await db.select().from(hospitalInvitesTable).where(eq(hospitalInvitesTable.email, email)).limit(1);
    
    if (existing && existing.status === "pending") {
      return NextResponse.json({ message: "Invite originally sent", token: existing.token }, { status: 200 });
    }

    const token = crypto.randomUUID().replace(/-/g, "").slice(0, 16); // secure 16-char token
    
    await db.insert(hospitalInvitesTable).values({
      id: crypto.randomUUID(),
      email,
      token,
      status: "pending"
    });

    // In a real app we would send an email here using sendgrid/aws ses.
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

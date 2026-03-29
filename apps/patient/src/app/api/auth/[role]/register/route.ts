import { NextResponse } from "next/server";
import { db } from "@/db";
import { usersTable, patientsTable, hospitalsTable, hospitalInvitesTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";

const patientRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2),
});

const hospitalRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  inviteToken: z.string().min(10), // Hospital requires an invite token
  contactNumber: z.string().optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ role: string }> }) {
  try {
    const p = await params;
    const { role } = p;
    
    if (!["patient", "hospital", "admin"].includes(role)) {
      return NextResponse.json({ error: "Invalid role specified in URL" }, { status: 400 });
    }

    // Admins cannot be registered through the public portal
    if (role === "admin") {
      return NextResponse.json({ error: "Admin registration is restricted" }, { status: 403 });
    }

    const body = await req.json();
    
    // Check if user exists broadly
    const existingUser = await db.select().from(usersTable).where(eq(usersTable.email, body.email)).limit(1);
    if (existingUser.length > 0) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(body.password, 10);

    if (role === "patient") {
      const parsed = patientRegisterSchema.safeParse(body);
      if (!parsed.success) return NextResponse.json({ error: "Invalid input", details: parsed.error.format() }, { status: 400 });
      const { email, fullName } = parsed.data;

      const userId = crypto.randomUUID();
      await db.insert(usersTable).values({ id: userId, email, passwordHash, role: "patient" });
      await db.insert(patientsTable).values({
        id: crypto.randomUUID(),
        userId,
        fullName,
      });

      return NextResponse.json({ message: "Registration successful" }, { status: 201 });
    } 
    
    if (role === "hospital") {
      const parsed = hospitalRegisterSchema.safeParse(body);
      if (!parsed.success) return NextResponse.json({ error: "Invalid input", details: parsed.error.format() }, { status: 400 });
      const { email, name, inviteToken, contactNumber } = parsed.data;

      // Validate Invite Token
      const [invite] = await db.select().from(hospitalInvitesTable).where(eq(hospitalInvitesTable.token, inviteToken)).limit(1);
      
      if (!invite || invite.status !== "pending" || invite.email !== email) {
        return NextResponse.json({ error: "Invalid, expired, or mismatched invite token" }, { status: 403 });
      }

      const userId = crypto.randomUUID();
      
      await db.transaction(async (tx) => {
        await tx.insert(usersTable).values({ id: userId, email, passwordHash, role: "hospital" });
        await tx.insert(hospitalsTable).values({
          id: crypto.randomUUID(),
          userId,
          name,
          contactNumber,
          approvalStatus: "approved", // auto approved because they used a valid invite link
        });
        
        // Mark invite as used
        await tx.update(hospitalInvitesTable).set({ status: "accepted" }).where(eq(hospitalInvitesTable.id, invite.id));
      });

      return NextResponse.json({ message: "Hospital registered successfully" }, { status: 201 });
    }

    return NextResponse.json({ error: "Unhandled role" }, { status: 400 });
  } catch (error) {
    console.error("Registration failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

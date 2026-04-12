import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { doctorsTable, hospitalsTable, usersTable } from "@/db/schema";
import { sendPasswordResetEmail } from "@/lib/email";
import { createPasswordResetToken } from "@/lib/password-reset";
import { getAuthenticatedAccessPayload } from "@/lib/server-auth";

export async function GET() {
  const payload = await getAuthenticatedAccessPayload(["hospital"]);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [hospital] = await db.select().from(hospitalsTable).where(eq(hospitalsTable.userId, payload.sub)).limit(1);
  if (!hospital) {
    return NextResponse.json({ error: "Hospital profile not found" }, { status: 404 });
  }

  const doctors = await db
    .select({
      id: doctorsTable.id,
      fullName: doctorsTable.fullName,
      specialization: doctorsTable.specialization,
      contactNumber: doctorsTable.contactNumber,
      isAvailable: doctorsTable.isAvailable,
      createdAt: doctorsTable.createdAt,
      userId: doctorsTable.userId,
      email: usersTable.email,
    })
    .from(doctorsTable)
    .leftJoin(usersTable, eq(usersTable.id, doctorsTable.userId))
    .where(eq(doctorsTable.hospitalId, hospital.id));

  return NextResponse.json({ doctors });
}

export async function POST(req: Request) {
  const payload = await getAuthenticatedAccessPayload(["hospital"]);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [hospital] = await db.select().from(hospitalsTable).where(eq(hospitalsTable.userId, payload.sub)).limit(1);
  if (!hospital) {
    return NextResponse.json({ error: "Hospital profile not found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const fullName = String(body?.fullName ?? "").trim();
    const specialization = String(body?.specialization ?? "").trim();
    const contactNumber = String(body?.contactNumber ?? "").trim();

    if (!email || !fullName) {
      return NextResponse.json({ error: "Doctor email and full name are required." }, { status: 400 });
    }

    let [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);

    if (user && user.role !== "doctor") {
      return NextResponse.json({ error: "This email is already registered to a non-doctor account." }, { status: 409 });
    }

    if (!user) {
      const tempPassword = randomTempPassword();
      const passwordHash = await bcrypt.hash(tempPassword, 10);
      const userId = crypto.randomUUID();

      await db.insert(usersTable).values({
        id: userId,
        email,
        passwordHash,
        role: "doctor",
      });

      [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    }

    if (!user) {
      return NextResponse.json({ error: "Unable to create doctor account." }, { status: 500 });
    }

    const [existingDoctor] = await db
      .select()
      .from(doctorsTable)
      .where(and(eq(doctorsTable.hospitalId, hospital.id), eq(doctorsTable.userId, user.id)))
      .limit(1);

    if (existingDoctor) {
      await db
        .update(doctorsTable)
        .set({
          fullName,
          specialization: specialization || null,
          contactNumber: contactNumber || null,
          isAvailable: true,
        })
        .where(eq(doctorsTable.id, existingDoctor.id));
    } else {
      await db.insert(doctorsTable).values({
        id: crypto.randomUUID(),
        hospitalId: hospital.id,
        userId: user.id,
        fullName,
        specialization: specialization || null,
        contactNumber: contactNumber || null,
        isAvailable: true,
      });
    }

    const rawToken = await createPasswordResetToken(user.id);
    const resetBaseUrl = process.env.HOSPITAL_RESET_PASSWORD_URL ?? "http://localhost:5000/reset-password";
    const resetUrl = `${resetBaseUrl}?token=${encodeURIComponent(rawToken)}`;
    await sendPasswordResetEmail(email, resetUrl);

    return NextResponse.json({
      message: existingDoctor
        ? "Doctor profile updated and a fresh sign-in/reset email has been sent."
        : "Doctor added and a sign-in/reset email has been sent.",
    });
  } catch (error) {
    console.error("Create doctor error:", error);
    return NextResponse.json({ error: "Unable to add doctor right now." }, { status: 500 });
  }
}

function randomTempPassword() {
  return `doc-${crypto.randomUUID()}`;
}

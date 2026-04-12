import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { doctorsTable, medicalRecordsTable, patientsTable, prescriptionsTable, usersTable } from "@/db/schema";
import { getAuthenticatedAccessPayload } from "@/lib/server-auth";

export async function POST(req: Request) {
  const payload = await getAuthenticatedAccessPayload(["doctor"]);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [doctor] = await db.select().from(doctorsTable).where(eq(doctorsTable.userId, payload.sub)).limit(1);
  if (!doctor) {
    return NextResponse.json({ error: "Doctor profile not found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const patientEmail = String(body?.patientEmail ?? "").trim().toLowerCase();
    const title = String(body?.title ?? "").trim();
    const description = String(body?.description ?? "").trim();
    const medication = String(body?.medication ?? "").trim();
    const dosage = String(body?.dosage ?? "").trim();
    const instructions = String(body?.instructions ?? "").trim();

    if (!patientEmail || !title || !description) {
      return NextResponse.json({ error: "Patient email, title, and description are required." }, { status: 400 });
    }

    const [patientUser] = await db
      .select()
      .from(usersTable)
      .where(and(eq(usersTable.email, patientEmail), eq(usersTable.role, "patient")))
      .limit(1);
    if (!patientUser) {
      return NextResponse.json({ error: "No registered patient was found with that email." }, { status: 404 });
    }

    const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.userId, patientUser.id)).limit(1);
    if (!patient) {
      return NextResponse.json({ error: "Patient profile not found." }, { status: 404 });
    }

    await db.insert(medicalRecordsTable).values({
      id: crypto.randomUUID(),
      patientId: patient.id,
      hospitalId: doctor.hospitalId,
      doctorId: doctor.id,
      title,
      description,
      fileUrl: null,
      recordDate: new Date(),
    });

    if (medication) {
      await db.insert(prescriptionsTable).values({
        id: crypto.randomUUID(),
        patientId: patient.id,
        medication,
        dosage: dosage || null,
        instructions: instructions || null,
      });
    }

    return NextResponse.json({ message: "Patient record uploaded successfully." });
  } catch (error) {
    console.error("Doctor upload patient record error:", error);
    return NextResponse.json({ error: "Unable to upload patient details right now." }, { status: 500 });
  }
}

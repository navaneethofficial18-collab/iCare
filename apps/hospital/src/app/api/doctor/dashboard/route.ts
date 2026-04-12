import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { doctorsTable, hospitalsTable, medicalRecordsTable, patientsTable, usersTable } from "@/db/schema";
import { getAuthenticatedAccessPayload } from "@/lib/server-auth";

export async function GET() {
  const payload = await getAuthenticatedAccessPayload(["doctor"]);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [doctor] = await db.select().from(doctorsTable).where(eq(doctorsTable.userId, payload.sub)).limit(1);
  if (!doctor) {
    return NextResponse.json({ error: "Doctor profile not found" }, { status: 404 });
  }

  const [hospital] = await db.select().from(hospitalsTable).where(eq(hospitalsTable.id, doctor.hospitalId)).limit(1);

  const recentRecords = await db
    .select({
      id: medicalRecordsTable.id,
      title: medicalRecordsTable.title,
      description: medicalRecordsTable.description,
      recordDate: medicalRecordsTable.recordDate,
      patientName: patientsTable.fullName,
    })
    .from(medicalRecordsTable)
    .leftJoin(patientsTable, eq(patientsTable.id, medicalRecordsTable.patientId))
    .where(eq(medicalRecordsTable.doctorId, doctor.id))
    .orderBy(desc(medicalRecordsTable.recordDate));

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.sub)).limit(1);

  return NextResponse.json({
    doctor: {
      ...doctor,
      email: user?.email ?? null,
    },
    hospital,
    recentRecords,
  });
}

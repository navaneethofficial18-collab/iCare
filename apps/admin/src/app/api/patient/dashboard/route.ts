import { NextResponse } from "next/server";
import { db } from "@/db";
import { patientsTable, hospitalsTable, appointmentsTable, admissionsTable, medicalRecordsTable, prescriptionsTable, loansTable, insurancePoliciesTable } from "@/db/schema";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { eq, desc } from "drizzle-orm";

async function verifyPatient() {
  const cookieStore = await cookies();
  const token = cookieStore.get("jwt")?.value;
  if (!token) return null;

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "caresync_super_secret_key");
    const { payload } = await jwtVerify(token, secret);
    if (payload.role !== "patient") return null;
    return payload.sub as string;
  } catch {
    return null;
  }
}

export async function GET() {
  const userId = await verifyPatient();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.userId, userId)).limit(1);
    if (!patient) return NextResponse.json({ error: "Patient profile not found" }, { status: 404 });

    const availableHospitals = await db.select({
      id: hospitalsTable.id,
      name: hospitalsTable.name,
      address: hospitalsTable.address,
      contactNumber: hospitalsTable.contactNumber
    }).from(hospitalsTable).where(eq(hospitalsTable.approvalStatus, "approved"));

    const appointments = await db.select({
      id: appointmentsTable.id,
      hospitalName: hospitalsTable.name,
      status: appointmentsTable.status,
      appointmentDate: appointmentsTable.appointmentDate,
      symptoms: appointmentsTable.symptoms
    })
    .from(appointmentsTable)
    .leftJoin(hospitalsTable, eq(appointmentsTable.hospitalId, hospitalsTable.id))
    .where(eq(appointmentsTable.patientId, patient.id))
    .orderBy(desc(appointmentsTable.appointmentDate));

    const records = await db.select().from(medicalRecordsTable).where(eq(medicalRecordsTable.patientId, patient.id)).orderBy(desc(medicalRecordsTable.recordDate));
    const prescriptions = await db.select().from(prescriptionsTable).where(eq(prescriptionsTable.patientId, patient.id)).orderBy(desc(prescriptionsTable.createdAt));
    const loans = await db.select().from(loansTable).where(eq(loansTable.patientId, patient.id)).orderBy(desc(loansTable.createdAt));
    const insurance = await db.select().from(insurancePoliciesTable).where(eq(insurancePoliciesTable.patientId, patient.id)).orderBy(desc(insurancePoliciesTable.createdAt));

    return NextResponse.json({
      patient,
      availableHospitals,
      appointments,
      records,
      prescriptions,
      loans,
      insurance
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

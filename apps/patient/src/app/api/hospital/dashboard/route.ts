import { NextResponse } from "next/server";
import { db } from "@/db";
import { hospitalsTable, doctorsTable, appointmentsTable, patientsTable, admissionsTable } from "@/db/schema";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { eq, desc } from "drizzle-orm";

async function verifyHospital() {
  const cookieStore = await cookies();
  const token = cookieStore.get("jwt")?.value;
  if (!token) return null;

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "caresync_super_secret_key");
    const { payload } = await jwtVerify(token, secret);
    if (payload.role !== "hospital") return null;
    return payload.sub as string; // userId
  } catch {
    return null;
  }
}

export async function GET() {
  const userId = await verifyHospital();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [hospital] = await db.select().from(hospitalsTable).where(eq(hospitalsTable.userId, userId)).limit(1);
    if (!hospital) return NextResponse.json({ error: "Hospital profile not found" }, { status: 404 });

    const doctors = await db.select().from(doctorsTable).where(eq(doctorsTable.hospitalId, hospital.id));
    
    // Fetch pending and confirmed appointments
    const appointments = await db.select({
      id: appointmentsTable.id,
      patientId: appointmentsTable.patientId,
      patientName: patientsTable.fullName,
      doctorId: appointmentsTable.doctorId,
      doctorName: doctorsTable.fullName,
      status: appointmentsTable.status,
      appointmentDate: appointmentsTable.appointmentDate,
      symptoms: appointmentsTable.symptoms,
      queuePosition: appointmentsTable.queuePosition
    })
    .from(appointmentsTable)
    .leftJoin(patientsTable, eq(appointmentsTable.patientId, patientsTable.id))
    .leftJoin(doctorsTable, eq(appointmentsTable.doctorId, doctorsTable.id))
    .where(eq(appointmentsTable.hospitalId, hospital.id))
    .orderBy(appointmentsTable.appointmentDate);

    const admissions = await db.select({
      id: admissionsTable.id,
      patientId: admissionsTable.patientId,
      patientName: patientsTable.fullName,
      status: admissionsTable.status,
      admissionDate: admissionsTable.admissionDate,
      bedNumber: admissionsTable.bedNumber
    })
    .from(admissionsTable)
    .leftJoin(patientsTable, eq(admissionsTable.patientId, patientsTable.id))
    .where(eq(admissionsTable.hospitalId, hospital.id))
    .orderBy(desc(admissionsTable.admissionDate));

    return NextResponse.json({
      hospital,
      doctors,
      appointments,
      admissions
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

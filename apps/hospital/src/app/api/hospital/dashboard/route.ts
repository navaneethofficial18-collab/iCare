import { NextResponse } from "next/server";
import { db } from "@/db";
import { hospitalsTable, doctorsTable, appointmentsTable, patientsTable, admissionsTable, medicalRecordsTable, usersTable } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { AUTH_COOKIE_NAME } from "@/lib/auth-cookie";
import { getAuthenticatedAccessPayload } from "@/lib/server-auth";

async function verifyHospital() {
  const payload = await getAuthenticatedAccessPayload(["hospital"]);
  return payload?.sub ?? null;
}

export async function GET() {
  const userId = await verifyHospital();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [hospital] = await db.select().from(hospitalsTable).where(eq(hospitalsTable.userId, userId)).limit(1);
    if (!hospital) return NextResponse.json({ error: "Hospital profile not found" }, { status: 404 });

    const doctors = await db
      .select({
        id: doctorsTable.id,
        fullName: doctorsTable.fullName,
        specialization: doctorsTable.specialization,
        contactNumber: doctorsTable.contactNumber,
        isAvailable: doctorsTable.isAvailable,
        userId: doctorsTable.userId,
        email: usersTable.email,
      })
      .from(doctorsTable)
      .leftJoin(usersTable, eq(usersTable.id, doctorsTable.userId))
      .where(eq(doctorsTable.hospitalId, hospital.id));
    
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

    const recentRecords = await db.select({
      id: medicalRecordsTable.id,
      title: medicalRecordsTable.title,
      description: medicalRecordsTable.description,
      recordDate: medicalRecordsTable.recordDate,
      patientName: patientsTable.fullName,
      doctorName: doctorsTable.fullName,
    })
    .from(medicalRecordsTable)
    .leftJoin(patientsTable, eq(medicalRecordsTable.patientId, patientsTable.id))
    .leftJoin(doctorsTable, eq(medicalRecordsTable.doctorId, doctorsTable.id))
    .where(eq(medicalRecordsTable.hospitalId, hospital.id))
    .orderBy(desc(medicalRecordsTable.recordDate));

    const patientDirectoryMap = new Map<string, { id: string; fullName: string; email: string | null }>();
    for (const appointment of appointments) {
      if (appointment.patientId && appointment.patientName) {
        patientDirectoryMap.set(appointment.patientId, {
          id: appointment.patientId,
          fullName: appointment.patientName,
          email: null,
        });
      }
    }
    for (const admission of admissions) {
      if (admission.patientId && admission.patientName && !patientDirectoryMap.has(admission.patientId)) {
        patientDirectoryMap.set(admission.patientId, {
          id: admission.patientId,
          fullName: admission.patientName,
          email: null,
        });
      }
    }
    for (const record of recentRecords) {
      const [patient] = record.patientName
        ? await db.select({
            id: patientsTable.id,
            fullName: patientsTable.fullName,
            email: usersTable.email,
          })
          .from(patientsTable)
          .leftJoin(usersTable, eq(usersTable.id, patientsTable.userId))
          .where(eq(patientsTable.fullName, record.patientName))
          .limit(1)
        : [];
      if (patient && !patientDirectoryMap.has(patient.id)) {
        patientDirectoryMap.set(patient.id, patient);
      }
    }

    return NextResponse.json({
      hospital,
      doctors,
      appointments,
      admissions,
      recentRecords,
      patientDirectory: Array.from(patientDirectoryMap.values()),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

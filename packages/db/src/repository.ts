import { db } from "./index";
import * as schema from "./schema";
import { eq, inArray, and } from "drizzle-orm";

// ----------------------------------------------------------------------
// Bulk Insert Helpers (Optimized for performance)
// ----------------------------------------------------------------------

export async function bulkInsertUsers(users: typeof schema.usersTable.$inferInsert[]) {
  if (!users.length) return [];
  await db.insert(schema.usersTable).values(users);
}

export async function bulkInsertPatients(patients: typeof schema.patientsTable.$inferInsert[]) {
  if (!patients.length) return [];
  await db.insert(schema.patientsTable).values(patients);
}

export async function bulkInsertDoctors(doctors: typeof schema.doctorsTable.$inferInsert[]) {
  if (!doctors.length) return [];
  await db.insert(schema.doctorsTable).values(doctors);
}

export async function bulkInsertAppointments(appointments: typeof schema.appointmentsTable.$inferInsert[]) {
  if (!appointments.length) return [];
  await db.insert(schema.appointmentsTable).values(appointments);
}

// ----------------------------------------------------------------------
// Optimized Repository Queries (Avoiding N+1)
// ----------------------------------------------------------------------

/**
 * Fetch a hospital along with its doctors to prevent N+1 queries.
 */
export async function getHospitalWithDoctors(hospitalId: string) {
  const hospital = await db.select().from(schema.hospitalsTable).where(eq(schema.hospitalsTable.id, hospitalId)).limit(1);
  if (!hospital.length) return null;

  const doctors = await db.select().from(schema.doctorsTable).where(eq(schema.doctorsTable.hospitalId, hospitalId));
  
  return {
    ...hospital[0],
    doctors
  };
}

/**
 * Fetch a patient with their full medical record history (appointments, admissions, prescriptions)
 * Structured efficiently without multiple detached queries.
 */
export async function getPatientFullProfile(patientId: string) {
  const patient = await db.select().from(schema.patientsTable).where(eq(schema.patientsTable.id, patientId)).limit(1);
  if (!patient.length) return null;

  const appointments = await db.select().from(schema.appointmentsTable).where(eq(schema.appointmentsTable.patientId, patientId));
  const admissions = await db.select().from(schema.admissionsTable).where(eq(schema.admissionsTable.patientId, patientId));
  const records = await db.select().from(schema.medicalRecordsTable).where(eq(schema.medicalRecordsTable.patientId, patientId));
  const prescriptions = await db.select().from(schema.prescriptionsTable).where(eq(schema.prescriptionsTable.patientId, patientId));

  return {
    ...patient[0],
    appointments,
    admissions,
    medicalRecords: records,
    prescriptions
  };
}

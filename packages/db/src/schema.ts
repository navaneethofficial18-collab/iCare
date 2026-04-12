import { sql } from "drizzle-orm";
import {
  datetime,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  boolean,
  varchar,
  index,
} from "drizzle-orm/mysql-core";

const idColumn = (name = "id") =>
  varchar(name, { length: 36 }).primaryKey().notNull().default(sql`(UUID())`);

const createdAtColumn = (name = "created_at") =>
  datetime(name, { mode: "date" }).default(sql`CURRENT_TIMESTAMP`);

const updatedAtColumn = (name = "updated_at") =>
  datetime(name, { mode: "date" }).default(sql`CURRENT_TIMESTAMP`);

export const usersTable = mysqlTable("users", {
  id: idColumn(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["patient", "hospital", "admin", "doctor"]).default("patient"),
  createdAt: createdAtColumn(),
  updatedAt: updatedAtColumn(),
}, (table) => ({
  emailIdx: index("email_idx").on(table.email),
  roleIdx: index("role_idx").on(table.role),
}));

export const patientsTable = mysqlTable("patients", {
  id: idColumn(),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  dateOfBirth: datetime("date_of_birth", { mode: "date" }),
  bloodGroup: varchar("blood_group", { length: 10 }),
  allergies: text("allergies"),
  createdAt: createdAtColumn(),
  updatedAt: updatedAtColumn(),
}, (table) => ({
  userIdIdx: index("user_id_idx").on(table.userId),
}));

export const hospitalsTable = mysqlTable("hospitals", {
  id: idColumn(),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address"),
  contactNumber: varchar("contact_number", { length: 50 }),
  approvalStatus: mysqlEnum("approval_status", ["pending", "approved", "rejected"]).default("pending"),
  createdAt: createdAtColumn(),
  updatedAt: updatedAtColumn(),
}, (table) => ({
  userIdIdx: index("user_id_idx").on(table.userId),
  approvalStatusIdx: index("approval_status_idx").on(table.approvalStatus),
}));

export const doctorsTable = mysqlTable("doctors", {
  id: idColumn(),
  hospitalId: varchar("hospital_id", { length: 36 }).notNull().references(() => hospitalsTable.id, { onDelete: "cascade" }),
  userId: varchar("user_id", { length: 36 }).references(() => usersTable.id, { onDelete: "set null" }),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  specialization: varchar("specialization", { length: 255 }),
  contactNumber: varchar("contact_number", { length: 50 }),
  isAvailable: boolean("is_available").default(true),
  createdAt: createdAtColumn(),
  updatedAt: updatedAtColumn(),
}, (table) => ({
  hospitalIdIdx: index("hospital_id_idx").on(table.hospitalId),
  userIdIdx: index("user_id_idx").on(table.userId),
}));

export const appointmentsTable = mysqlTable("appointments", {
  id: idColumn(),
  patientId: varchar("patient_id", { length: 36 }).notNull().references(() => patientsTable.id, { onDelete: "cascade" }),
  hospitalId: varchar("hospital_id", { length: 36 }).notNull().references(() => hospitalsTable.id, { onDelete: "cascade" }),
  doctorId: varchar("doctor_id", { length: 36 }).references(() => doctorsTable.id, { onDelete: "set null" }),
  status: mysqlEnum("status", ["pending", "confirmed", "completed", "cancelled"]).default("pending"),
  appointmentDate: datetime("appointment_date", { mode: "date" }).notNull(),
  tokenNumber: int("token_number"),
  queuePosition: int("queue_position"),
  symptoms: text("symptoms"),
  createdAt: createdAtColumn(),
  updatedAt: updatedAtColumn(),
}, (table) => ({
  patientIdIdx: index("patient_id_idx").on(table.patientId),
  hospitalIdIdx: index("hospital_id_idx").on(table.hospitalId),
  doctorIdIdx: index("doctor_id_idx").on(table.doctorId),
  appointmentDateIdx: index("appointment_date_idx").on(table.appointmentDate),
}));

export const admissionsTable = mysqlTable("admissions", {
  id: idColumn(),
  patientId: varchar("patient_id", { length: 36 }).notNull().references(() => patientsTable.id, { onDelete: "cascade" }),
  hospitalId: varchar("hospital_id", { length: 36 }).notNull().references(() => hospitalsTable.id, { onDelete: "cascade" }),
  doctorId: varchar("doctor_id", { length: 36 }).references(() => doctorsTable.id, { onDelete: "set null" }),
  admissionDate: datetime("admission_date", { mode: "date" }).default(sql`CURRENT_TIMESTAMP`),
  dischargeDate: datetime("discharge_date", { mode: "date" }),
  status: mysqlEnum("status", ["admitted", "discharged", "transferred"]).default("admitted"),
  bedNumber: varchar("bed_number", { length: 50 }),
  reason: text("reason"),
  createdAt: createdAtColumn(),
  updatedAt: updatedAtColumn(),
}, (table) => ({
  patientIdIdx: index("patient_id_idx").on(table.patientId),
  hospitalIdIdx: index("hospital_id_idx").on(table.hospitalId),
}));

export const hospitalInvitesTable = mysqlTable("hospital_invites", {
  id: idColumn(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  status: mysqlEnum("status", ["pending", "accepted", "expired"]).default("pending"),
  createdAt: createdAtColumn(),
});

export const passwordResetTokensTable = mysqlTable("password_reset_tokens", {
  id: idColumn(),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  tokenHash: varchar("token_hash", { length: 255 }).notNull().unique(),
  expiresAt: datetime("expires_at", { mode: "date" }).notNull(),
  usedAt: datetime("used_at", { mode: "date" }),
  createdAt: createdAtColumn(),
});

export const insurancePoliciesTable = mysqlTable("insurance_policies", {
  id: idColumn(),
  patientId: varchar("patient_id", { length: 36 }).references(() => patientsTable.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  premium: int("premium"),
  coverageAmount: int("coverage_amount"),
  provider: varchar("provider", { length: 255 }),
  createdAt: createdAtColumn(),
});

export const loansTable = mysqlTable("loans", {
  id: idColumn(),
  patientId: varchar("patient_id", { length: 36 }).notNull().references(() => patientsTable.id, { onDelete: "cascade" }),
  amount: int("amount").notNull(),
  reason: text("reason"),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending"),
  createdAt: createdAtColumn(),
  updatedAt: updatedAtColumn(),
});

export const medicalRecordsTable = mysqlTable("medical_records", {
  id: idColumn(),
  patientId: varchar("patient_id", { length: 36 }).notNull().references(() => patientsTable.id, { onDelete: "cascade" }),
  hospitalId: varchar("hospital_id", { length: 36 }).references(() => hospitalsTable.id, { onDelete: "cascade" }),
  doctorId: varchar("doctor_id", { length: 36 }).references(() => doctorsTable.id, { onDelete: "set null" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  fileUrl: varchar("file_url", { length: 500 }),
  recordDate: datetime("record_date", { mode: "date" }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  patientIdIdx: index("patient_id_idx").on(table.patientId),
  hospitalIdIdx: index("hospital_id_idx").on(table.hospitalId),
  recordDateIdx: index("record_date_idx").on(table.recordDate),
}));

export const prescriptionsTable = mysqlTable("prescriptions", {
  id: idColumn(),
  appointmentId: varchar("appointment_id", { length: 36 }).references(() => appointmentsTable.id, { onDelete: "cascade" }),
  admissionId: varchar("admission_id", { length: 36 }).references(() => admissionsTable.id, { onDelete: "cascade" }),
  patientId: varchar("patient_id", { length: 36 }).notNull().references(() => patientsTable.id, { onDelete: "cascade" }),
  medication: varchar("medication", { length: 255 }).notNull(),
  dosage: varchar("dosage", { length: 100 }),
  instructions: text("instructions"),
  createdAt: createdAtColumn(),
});

export const syncLogsTable = mysqlTable("sync_logs", {
  id: idColumn(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  actionType: varchar("action_type", { length: 100 }).notNull(),
  status: mysqlEnum("status", ["pending", "success", "failed"]).default("pending"),
  payload: text("payload"),
  createdAt: createdAtColumn(),
});

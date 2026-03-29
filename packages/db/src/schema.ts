import { mysqlTable, varchar, text, datetime, int, mysqlEnum, boolean } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const usersTable = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["patient", "hospital", "admin"]).default("patient"),
  createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at").default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => new Date()),
});

export const patientsTable = mysqlTable("patients", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  dateOfBirth: datetime("date_of_birth"),
  bloodGroup: varchar("blood_group", { length: 10 }),
  allergies: text("allergies"),
  createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at").default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => new Date()),
});

export const hospitalsTable = mysqlTable("hospitals", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address"),
  contactNumber: varchar("contact_number", { length: 50 }),
  approvalStatus: mysqlEnum("approval_status", ["pending", "approved", "rejected"]).default("pending"),
  createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at").default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => new Date()),
});

export const hospitalInvitesTable = mysqlTable("hospital_invites", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  email: varchar("email", { length: 255 }).notNull().unique(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  status: mysqlEnum("status", ["pending", "accepted", "expired"]).default("pending"),
  createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const doctorsTable = mysqlTable("doctors", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  hospitalId: varchar("hospital_id", { length: 36 }).notNull().references(() => hospitalsTable.id, { onDelete: 'cascade' }),
  userId: varchar("user_id", { length: 36 }).references(() => usersTable.id, { onDelete: 'set null' }), // Optional user login for doctor
  fullName: varchar("full_name", { length: 255 }).notNull(),
  specialization: varchar("specialization", { length: 255 }),
  contactNumber: varchar("contact_number", { length: 50 }),
  isAvailable: boolean("is_available").default(true),
  createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at").default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => new Date()),
});

export const appointmentsTable = mysqlTable("appointments", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  patientId: varchar("patient_id", { length: 36 }).notNull().references(() => patientsTable.id, { onDelete: 'cascade' }),
  hospitalId: varchar("hospital_id", { length: 36 }).notNull().references(() => hospitalsTable.id, { onDelete: 'cascade' }),
  doctorId: varchar("doctor_id", { length: 36 }).references(() => doctorsTable.id, { onDelete: 'set null' }),
  status: mysqlEnum("status", ["pending", "confirmed", "completed", "cancelled"]).default("pending"),
  appointmentDate: datetime("appointment_date").notNull(),
  tokenNumber: int("token_number"),
  queuePosition: int("queue_position"),
  symptoms: text("symptoms"),
  createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at").default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => new Date()),
});

export const admissionsTable = mysqlTable("admissions", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  patientId: varchar("patient_id", { length: 36 }).notNull().references(() => patientsTable.id, { onDelete: 'cascade' }),
  hospitalId: varchar("hospital_id", { length: 36 }).notNull().references(() => hospitalsTable.id, { onDelete: 'cascade' }),
  doctorId: varchar("doctor_id", { length: 36 }).references(() => doctorsTable.id, { onDelete: 'set null' }),
  admissionDate: datetime("admission_date").default(sql`CURRENT_TIMESTAMP`),
  dischargeDate: datetime("discharge_date"),
  status: mysqlEnum("status", ["admitted", "discharged", "transferred"]).default("admitted"),
  bedNumber: varchar("bed_number", { length: 50 }),
  reason: text("reason"),
  createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at").default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => new Date()),
});

export const medicalRecordsTable = mysqlTable("medical_records", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  patientId: varchar("patient_id", { length: 36 }).notNull().references(() => patientsTable.id, { onDelete: 'cascade' }),
  hospitalId: varchar("hospital_id", { length: 36 }).references(() => hospitalsTable.id, { onDelete: 'cascade' }),
  doctorId: varchar("doctor_id", { length: 36 }).references(() => doctorsTable.id, { onDelete: 'set null' }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  fileUrl: varchar("file_url", { length: 500 }),
  recordDate: datetime("record_date").default(sql`CURRENT_TIMESTAMP`),
});

export const prescriptionsTable = mysqlTable("prescriptions", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  appointmentId: varchar("appointment_id", { length: 36 }).references(() => appointmentsTable.id, { onDelete: 'cascade' }),
  admissionId: varchar("admission_id", { length: 36 }).references(() => admissionsTable.id, { onDelete: 'cascade' }),
  patientId: varchar("patient_id", { length: 36 }).notNull().references(() => patientsTable.id, { onDelete: 'cascade' }),
  medication: varchar("medication", { length: 255 }).notNull(),
  dosage: varchar("dosage", { length: 100 }),
  instructions: text("instructions"),
  createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insurancePoliciesTable = mysqlTable("insurance_policies", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  patientId: varchar("patient_id", { length: 36 }).references(() => patientsTable.id, { onDelete: 'cascade' }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  premium: int("premium"),
  coverageAmount: int("coverage_amount"),
  provider: varchar("provider", { length: 255 }),
  createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const loansTable = mysqlTable("loans", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  patientId: varchar("patient_id", { length: 36 }).notNull().references(() => patientsTable.id, { onDelete: 'cascade' }),
  amount: int("amount").notNull(),
  reason: text("reason"),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending"),
  createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at").default(sql`CURRENT_TIMESTAMP`).$onUpdateFn(() => new Date()),
});

export const syncLogsTable = mysqlTable("sync_logs", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  userId: varchar("user_id", { length: 36 }).notNull(),
  actionType: varchar("action_type", { length: 100 }).notNull(),
  status: mysqlEnum("status", ["pending", "success", "failed"]).default("pending"),
  payload: text("payload"),
  createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP`),
});

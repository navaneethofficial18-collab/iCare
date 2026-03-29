CREATE TABLE `admissions` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`patient_id` varchar(36) NOT NULL,
	`hospital_id` varchar(36) NOT NULL,
	`doctor_id` varchar(36),
	`admission_date` datetime DEFAULT CURRENT_TIMESTAMP,
	`discharge_date` datetime,
	`status` enum('admitted','discharged','transferred') DEFAULT 'admitted',
	`bed_number` varchar(50),
	`reason` text,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `admissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `doctors` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`hospital_id` varchar(36) NOT NULL,
	`user_id` varchar(36),
	`full_name` varchar(255) NOT NULL,
	`specialization` varchar(255),
	`contact_number` varchar(50),
	`is_available` boolean DEFAULT true,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `doctors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hospital_invites` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`email` varchar(255) NOT NULL,
	`token` varchar(255) NOT NULL,
	`status` enum('pending','accepted','expired') DEFAULT 'pending',
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `hospital_invites_id` PRIMARY KEY(`id`),
	CONSTRAINT `hospital_invites_email_unique` UNIQUE(`email`),
	CONSTRAINT `hospital_invites_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
ALTER TABLE `appointments` DROP FOREIGN KEY `appointments_patient_id_patients_id_fk`;
--> statement-breakpoint
ALTER TABLE `appointments` DROP FOREIGN KEY `appointments_hospital_id_hospitals_id_fk`;
--> statement-breakpoint
ALTER TABLE `hospitals` DROP FOREIGN KEY `hospitals_user_id_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `loans` DROP FOREIGN KEY `loans_patient_id_patients_id_fk`;
--> statement-breakpoint
ALTER TABLE `medical_records` DROP FOREIGN KEY `medical_records_patient_id_patients_id_fk`;
--> statement-breakpoint
ALTER TABLE `medical_records` DROP FOREIGN KEY `medical_records_hospital_id_hospitals_id_fk`;
--> statement-breakpoint
ALTER TABLE `patients` DROP FOREIGN KEY `patients_user_id_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `prescriptions` DROP FOREIGN KEY `prescriptions_appointment_id_appointments_id_fk`;
--> statement-breakpoint
ALTER TABLE `hospitals` MODIFY COLUMN `id` varchar(36) NOT NULL DEFAULT (UUID());--> statement-breakpoint
ALTER TABLE `patients` MODIFY COLUMN `id` varchar(36) NOT NULL DEFAULT (UUID());--> statement-breakpoint
ALTER TABLE `prescriptions` MODIFY COLUMN `appointment_id` varchar(36);--> statement-breakpoint
ALTER TABLE `appointments` ADD `doctor_id` varchar(36);--> statement-breakpoint
ALTER TABLE `appointments` ADD `queue_position` int;--> statement-breakpoint
ALTER TABLE `hospitals` ADD `approval_status` enum('pending','approved','rejected') DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `insurance_policies` ADD `patient_id` varchar(36);--> statement-breakpoint
ALTER TABLE `insurance_policies` ADD `provider` varchar(255);--> statement-breakpoint
ALTER TABLE `insurance_policies` ADD `created_at` datetime DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `medical_records` ADD `doctor_id` varchar(36);--> statement-breakpoint
ALTER TABLE `prescriptions` ADD `admission_id` varchar(36);--> statement-breakpoint
ALTER TABLE `prescriptions` ADD `patient_id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `admissions` ADD CONSTRAINT `admissions_patient_id_patients_id_fk` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `admissions` ADD CONSTRAINT `admissions_hospital_id_hospitals_id_fk` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `admissions` ADD CONSTRAINT `admissions_doctor_id_doctors_id_fk` FOREIGN KEY (`doctor_id`) REFERENCES `doctors`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `doctors` ADD CONSTRAINT `doctors_hospital_id_hospitals_id_fk` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `doctors` ADD CONSTRAINT `doctors_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_doctor_id_doctors_id_fk` FOREIGN KEY (`doctor_id`) REFERENCES `doctors`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_patient_id_patients_id_fk` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_hospital_id_hospitals_id_fk` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `hospitals` ADD CONSTRAINT `hospitals_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `insurance_policies` ADD CONSTRAINT `insurance_policies_patient_id_patients_id_fk` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `loans` ADD CONSTRAINT `loans_patient_id_patients_id_fk` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `medical_records` ADD CONSTRAINT `medical_records_doctor_id_doctors_id_fk` FOREIGN KEY (`doctor_id`) REFERENCES `doctors`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `medical_records` ADD CONSTRAINT `medical_records_patient_id_patients_id_fk` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `medical_records` ADD CONSTRAINT `medical_records_hospital_id_hospitals_id_fk` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `patients` ADD CONSTRAINT `patients_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `prescriptions` ADD CONSTRAINT `prescriptions_admission_id_admissions_id_fk` FOREIGN KEY (`admission_id`) REFERENCES `admissions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `prescriptions` ADD CONSTRAINT `prescriptions_patient_id_patients_id_fk` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `prescriptions` ADD CONSTRAINT `prescriptions_appointment_id_appointments_id_fk` FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON DELETE cascade ON UPDATE no action;
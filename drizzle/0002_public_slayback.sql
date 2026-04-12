CREATE TABLE `password_reset_tokens` (
	`id` varchar(36) NOT NULL DEFAULT (UUID()),
	`user_id` varchar(36) NOT NULL,
	`token_hash` varchar(255) NOT NULL,
	`expires_at` datetime NOT NULL,
	`used_at` datetime,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `password_reset_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `password_reset_tokens_token_hash_unique` UNIQUE(`token_hash`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('patient','hospital','admin','doctor') DEFAULT 'patient';--> statement-breakpoint
ALTER TABLE `password_reset_tokens` ADD CONSTRAINT `password_reset_tokens_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `patient_id_idx` ON `admissions` (`patient_id`);--> statement-breakpoint
CREATE INDEX `hospital_id_idx` ON `admissions` (`hospital_id`);--> statement-breakpoint
CREATE INDEX `patient_id_idx` ON `appointments` (`patient_id`);--> statement-breakpoint
CREATE INDEX `hospital_id_idx` ON `appointments` (`hospital_id`);--> statement-breakpoint
CREATE INDEX `doctor_id_idx` ON `appointments` (`doctor_id`);--> statement-breakpoint
CREATE INDEX `appointment_date_idx` ON `appointments` (`appointment_date`);--> statement-breakpoint
CREATE INDEX `hospital_id_idx` ON `doctors` (`hospital_id`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `doctors` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `hospitals` (`user_id`);--> statement-breakpoint
CREATE INDEX `approval_status_idx` ON `hospitals` (`approval_status`);--> statement-breakpoint
CREATE INDEX `patient_id_idx` ON `medical_records` (`patient_id`);--> statement-breakpoint
CREATE INDEX `hospital_id_idx` ON `medical_records` (`hospital_id`);--> statement-breakpoint
CREATE INDEX `record_date_idx` ON `medical_records` (`record_date`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `patients` (`user_id`);--> statement-breakpoint
CREATE INDEX `email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `role_idx` ON `users` (`role`);
CREATE TABLE `paystack_developer_fees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(255) NOT NULL,
	`identifier` varchar(255) NOT NULL,
	`type` enum('admission_form','school_fees') NOT NULL,
	`session_id` int,
	`amount` decimal(12,2) NOT NULL,
	`reference` varchar(100) NOT NULL,
	`status` enum('pending','paid','failed') DEFAULT 'pending',
	`paid_at` timestamp,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `paystack_developer_fees_id` PRIMARY KEY(`id`),
	CONSTRAINT `paystack_developer_fees_reference_unique` UNIQUE(`reference`)
);
--> statement-breakpoint
CREATE TABLE `student_medical_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`student_id` int NOT NULL,
	`common_illness` varchar(255),
	`illness_frequency` varchar(100),
	`last_occurrence` varchar(100),
	`illness_description` text,
	`weight` varchar(50),
	`height` varchar(50),
	`blood_pressure` varchar(50),
	`allergies` text,
	`medical_history` text,
	`current_medications` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `student_medical_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `developer_subscription_settings` ADD `duration_months` int DEFAULT 4;--> statement-breakpoint
ALTER TABLE `developer_subscription_settings` ADD `sync_with_calendar` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `developer_subscription_settings` ADD `lock_week` int DEFAULT 4;--> statement-breakpoint
ALTER TABLE `developer_subscriptions` ADD `valid_until` datetime;--> statement-breakpoint
ALTER TABLE `paystack_developer_fees` ADD CONSTRAINT `paystack_developer_fees_session_id_academic_sessions_id_fk` FOREIGN KEY (`session_id`) REFERENCES `academic_sessions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_medical_records` ADD CONSTRAINT `student_medical_records_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;
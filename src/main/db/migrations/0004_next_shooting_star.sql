CREATE TABLE `screenshots` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`log_id` text,
	`file_path` text NOT NULL,
	`timestamp` integer NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`log_id`) REFERENCES `logs`(`id`) ON UPDATE no action ON DELETE set null
);

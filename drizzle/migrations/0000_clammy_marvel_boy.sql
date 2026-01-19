CREATE TABLE `expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`description` text NOT NULL,
	`amount` integer NOT NULL,
	`is_billable` integer DEFAULT true,
	`markup` integer,
	`date` integer,
	`created_at` integer,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`invoice_number` text NOT NULL,
	`issue_date` integer NOT NULL,
	`due_date` integer NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`subtotal` integer NOT NULL,
	`tax` integer,
	`total` integer NOT NULL,
	`currency` text DEFAULT 'USD',
	`notes` text,
	`line_items` text NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `logs` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`service_id` text,
	`start_time` integer,
	`end_time` integer,
	`duration` integer,
	`quantity` real,
	`notes` text,
	`activity_score` integer,
	`tags` text,
	`created_at` integer,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`client_name` text,
	`type` text NOT NULL,
	`currency` text DEFAULT 'USD',
	`hourly_rate` integer,
	`fixed_price` integer,
	`archived` integer DEFAULT false,
	`assets_path` text,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `services` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`billing_model` text NOT NULL,
	`default_price` integer,
	`unit_name` text,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text,
	`updated_at` integer
);

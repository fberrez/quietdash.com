CREATE TABLE `dashboards` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`name` text NOT NULL,
	`layout` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `devices` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`name` text NOT NULL,
	`fingerprint` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`token_hash` text,
	`dashboard_id` text,
	`last_seen_at` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`dashboard_id`) REFERENCES `dashboards`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `devices_token_hash_unique` ON `devices` (`token_hash`);--> statement-breakpoint
CREATE TABLE `pairings` (
	`id` text PRIMARY KEY NOT NULL,
	`device_id` text NOT NULL,
	`claim_code` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`instance_name` text NOT NULL,
	`auth_mode` text DEFAULT 'single-password' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text,
	`password_hash` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);

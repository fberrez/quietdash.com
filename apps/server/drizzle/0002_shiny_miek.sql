PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_devices` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text,
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
INSERT INTO `__new_devices`("id", "owner_id", "name", "fingerprint", "status", "token_hash", "dashboard_id", "last_seen_at", "created_at") SELECT "id", "owner_id", "name", "fingerprint", "status", "token_hash", "dashboard_id", "last_seen_at", "created_at" FROM `devices`;--> statement-breakpoint
DROP TABLE `devices`;--> statement-breakpoint
ALTER TABLE `__new_devices` RENAME TO `devices`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `devices_token_hash_unique` ON `devices` (`token_hash`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);
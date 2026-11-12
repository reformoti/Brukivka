CREATE TABLE `xar_auth_attempts` (
	`key_hash` text PRIMARY KEY NOT NULL,
	`window_start` integer NOT NULL,
	`hits` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `xar_credentials` (
	`user_id` text PRIMARY KEY NOT NULL,
	`gmail` text NOT NULL,
	`salt` text NOT NULL,
	`password_hash` text NOT NULL,
	`algorithm` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `accounts`(`user_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `xar_credentials_gmail_unique` ON `xar_credentials` (`gmail`);--> statement-breakpoint
CREATE TABLE `xar_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `accounts`(`user_id`) ON UPDATE no action ON DELETE no action
);

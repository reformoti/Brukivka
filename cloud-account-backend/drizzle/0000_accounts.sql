CREATE TABLE `accounts` (
	`user_id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_username_unique` ON `accounts` (lower("username"));--> statement-breakpoint
CREATE TABLE `save_history` (
	`user_id` text NOT NULL,
	`revision` integer NOT NULL,
	`payload` text NOT NULL,
	`checksum` text NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `revision`),
	FOREIGN KEY (`user_id`) REFERENCES `accounts`(`user_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `saves` (
	`user_id` text PRIMARY KEY NOT NULL,
	`revision` integer NOT NULL,
	`payload` text NOT NULL,
	`checksum` text NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `accounts`(`user_id`) ON UPDATE no action ON DELETE no action
);

--> statement-breakpoint
CREATE TRIGGER save_previous BEFORE UPDATE ON saves BEGIN INSERT OR IGNORE INTO save_history VALUES(OLD.user_id,OLD.revision,OLD.payload,OLD.checksum,OLD.updated_at); DELETE FROM save_history WHERE user_id=OLD.user_id AND revision<OLD.revision-2; END;

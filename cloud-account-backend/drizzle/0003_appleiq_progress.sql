CREATE TABLE `appleiq_save_history` (
	`user_id` text NOT NULL,
	`revision` integer NOT NULL,
	`payload` text NOT NULL,
	`object_key` text,
	`checksum` text NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `revision`),
	FOREIGN KEY (`user_id`) REFERENCES `accounts`(`user_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `appleiq_saves` (
	`user_id` text PRIMARY KEY NOT NULL,
	`revision` integer NOT NULL,
	`payload` text NOT NULL,
	`object_key` text,
	`checksum` text NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `accounts`(`user_id`) ON UPDATE no action ON DELETE no action
);

--> statement-breakpoint
CREATE TRIGGER appleiq_save_previous BEFORE UPDATE ON appleiq_saves BEGIN INSERT OR IGNORE INTO appleiq_save_history(user_id,revision,payload,checksum,updated_at,object_key) VALUES(OLD.user_id,OLD.revision,OLD.payload,OLD.checksum,OLD.updated_at,OLD.object_key); DELETE FROM appleiq_save_history WHERE user_id=OLD.user_id AND revision<OLD.revision-2; END;

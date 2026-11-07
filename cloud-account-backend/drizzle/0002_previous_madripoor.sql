CREATE TABLE `homow_tickets` (
	`hash` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`username` text NOT NULL,
	`audience` text NOT NULL,
	`expires_at` integer NOT NULL
);

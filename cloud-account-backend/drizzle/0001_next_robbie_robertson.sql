ALTER TABLE `save_history` ADD `object_key` text;--> statement-breakpoint
ALTER TABLE `saves` ADD `object_key` text;
--> statement-breakpoint
DROP TRIGGER save_previous;
--> statement-breakpoint
CREATE TRIGGER save_previous BEFORE UPDATE ON saves BEGIN INSERT OR IGNORE INTO save_history(user_id,revision,payload,checksum,updated_at,object_key) VALUES(OLD.user_id,OLD.revision,OLD.payload,OLD.checksum,OLD.updated_at,OLD.object_key); DELETE FROM save_history WHERE user_id=OLD.user_id AND revision<OLD.revision-2; END;

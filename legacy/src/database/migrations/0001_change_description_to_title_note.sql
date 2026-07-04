ALTER TABLE `expenses` RENAME COLUMN `description` TO `title`;
--> statement-breakpoint
UPDATE `expenses` SET `title` = 'Untitled' WHERE `title` IS NULL;
--> statement-breakpoint
ALTER TABLE `expenses` ADD COLUMN `note` text;

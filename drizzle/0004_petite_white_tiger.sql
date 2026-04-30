ALTER TABLE `test_sessions` ADD `topic` text;--> statement-breakpoint
ALTER TABLE `test_sessions` ADD `test_type` text DEFAULT 'mock';--> statement-breakpoint
ALTER TABLE `user_answers` ADD `answered_at` integer;--> statement-breakpoint
ALTER TABLE `user_answers` ADD `seconds_spend` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `user_answers` ADD `correct_option` text NOT NULL DEFAULT '';

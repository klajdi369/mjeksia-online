PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_user_answers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` integer NOT NULL,
	`question_id` integer NOT NULL,
	`selected_option` text,
	`is_correct` integer,
	FOREIGN KEY (`session_id`) REFERENCES `test_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_user_answers`("id", "session_id", "question_id", "selected_option", "is_correct") SELECT "id", "session_id", "question_id", "selected_option", "is_correct" FROM `user_answers`;--> statement-breakpoint
DROP TABLE `user_answers`;--> statement-breakpoint
ALTER TABLE `__new_user_answers` RENAME TO `user_answers`;--> statement-breakpoint
PRAGMA foreign_keys=ON;

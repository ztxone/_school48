CREATE TABLE `photo_selections` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`last_name` text NOT NULL,
	`normalized_last_name` text NOT NULL,
	`cover_photo` text NOT NULL,
	`vignette_photo` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `photo_selections_unique_last_name` ON `photo_selections` (`normalized_last_name`);--> statement-breakpoint
CREATE TABLE `student_photo_options` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`last_name` text NOT NULL,
	`normalized_last_name` text NOT NULL,
	`file_name` text NOT NULL,
	`image_path` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `student_photo_options_unique_file` ON `student_photo_options` (`normalized_last_name`,`file_name`);
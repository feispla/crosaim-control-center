CREATE TABLE `clips` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(180) NOT NULL,
	`url` varchar(768) NOT NULL,
	`size` int NOT NULL,
	`contentType` varchar(120) NOT NULL,
	`status` enum('Subido','Vista previa local') NOT NULL DEFAULT 'Subido',
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `clips_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contentItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(180) NOT NULL,
	`type` varchar(120) NOT NULL,
	`platform` enum('Tracker.gg','TikTok / Reels','Discord') NOT NULL,
	`status` enum('Borrador','Listo para publicar','Publicado') NOT NULL DEFAULT 'Borrador',
	`accent` varchar(16) NOT NULL,
	`description` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contentItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rosterPlayers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`handle` varchar(120) NOT NULL,
	`role` varchar(80) NOT NULL,
	`rank` varchar(80) NOT NULL,
	`availability` varchar(120) NOT NULL,
	`status` enum('Activo','Tryout','Pendiente') NOT NULL DEFAULT 'Pendiente',
	`source` enum('Tracker.gg','TPG','CROSAIM','Discord') NOT NULL DEFAULT 'CROSAIM',
	`color` varchar(16) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rosterPlayers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scheduleItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`time` varchar(5) NOT NULL,
	`title` varchar(180) NOT NULL,
	`platform` enum('Tracker.gg','TikTok / Reels','Discord') NOT NULL,
	`status` enum('Planificada','Publicada','Borrador') NOT NULL DEFAULT 'Planificada',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scheduleItems_id` PRIMARY KEY(`id`)
);

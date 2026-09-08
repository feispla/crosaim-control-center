CREATE TABLE `applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerName` varchar(120) NOT NULL,
	`discordUsername` varchar(120) NOT NULL,
	`discordUserId` varchar(40),
	`contact` varchar(180),
	`role` varchar(80) NOT NULL,
	`rank` varchar(80) NOT NULL,
	`message` text NOT NULL,
	`status` enum('Pendiente','En revisión','Entrevista','Aprobada','Rechazada') NOT NULL DEFAULT 'Pendiente',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `applications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(180) NOT NULL,
	`detail` text NOT NULL,
	`severity` enum('info','success','warning','urgent') NOT NULL DEFAULT 'info',
	`source` varchar(80) NOT NULL DEFAULT 'CROSAIM',
	`read` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pushSubscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`endpoint` text NOT NULL,
	`p256dh` text NOT NULL,
	`auth` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pushSubscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `pushSubscriptions_endpoint_unique` UNIQUE(`endpoint`)
);

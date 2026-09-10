CREATE TABLE `discordEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventType` varchar(40) NOT NULL,
	`dedupeKey` varchar(180) NOT NULL,
	`payload` text NOT NULL,
	`status` enum('pending','sent','failed') NOT NULL DEFAULT 'pending',
	`attempts` int NOT NULL DEFAULT 0,
	`lastError` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`processedAt` timestamp,
	CONSTRAINT `discordEvents_id` PRIMARY KEY(`id`),
	CONSTRAINT `discordEvents_dedupeKey_unique` UNIQUE(`dedupeKey`)
);

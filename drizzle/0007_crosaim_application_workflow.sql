-- CROSAIM workflow: preserve legacy rows while moving to explicit states.
ALTER TABLE `applications` MODIFY COLUMN `status` enum('Pendiente','En revisión','Entrevista','Aprobada','Rechazada','POSTULACIÓN','REVISIÓN','ENTREVISTA','APROBADA','RECHAZADA','ROSTER','TRYOUT') NOT NULL DEFAULT 'POSTULACIÓN';--> statement-breakpoint
UPDATE `applications` SET `status` = CASE `status`
  WHEN 'Pendiente' THEN 'POSTULACIÓN'
  WHEN 'En revisión' THEN 'REVISIÓN'
  WHEN 'Entrevista' THEN 'ENTREVISTA'
  WHEN 'Aprobada' THEN 'APROBADA'
  WHEN 'Rechazada' THEN 'RECHAZADA'
  ELSE `status`
END;--> statement-breakpoint
ALTER TABLE `applications` MODIFY COLUMN `status` enum('POSTULACIÓN','REVISIÓN','ENTREVISTA','APROBADA','RECHAZADA','ROSTER','TRYOUT') NOT NULL DEFAULT 'POSTULACIÓN';--> statement-breakpoint
ALTER TABLE `applications` ADD `trackingToken` varchar(64);--> statement-breakpoint
ALTER TABLE `applications` ADD `statusChangedAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `applications` ADD `statusChangedByUserId` int;--> statement-breakpoint
UPDATE `applications` SET `trackingToken` = concat('legacy-', `id`) WHERE `trackingToken` IS NULL;--> statement-breakpoint
ALTER TABLE `applications` MODIFY COLUMN `trackingToken` varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE `applications` ADD CONSTRAINT `applications_trackingToken_unique` UNIQUE(`trackingToken`);--> statement-breakpoint
CREATE TABLE `applicationStateChanges` (
  `id` int AUTO_INCREMENT NOT NULL,
  `eventId` varchar(64) NOT NULL,
  `applicationId` int NOT NULL,
  `fromStatus` varchar(32),
  `toStatus` varchar(32) NOT NULL,
  `actorUserId` int,
  `actorType` varchar(32) NOT NULL DEFAULT 'staff',
  `source` varchar(32) NOT NULL DEFAULT 'web',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `applicationStateChanges_id` PRIMARY KEY(`id`),
  CONSTRAINT `applicationStateChanges_eventId_unique` UNIQUE(`eventId`)
);--> statement-breakpoint
CREATE TABLE `discordAccounts` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `discordId` varchar(40) NOT NULL,
  `username` varchar(120) NOT NULL,
  `displayName` varchar(120),
  `avatarUrl` varchar(768),
  `inCrosaimGuild` boolean NOT NULL DEFAULT false,
  `linkedAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `discordAccounts_id` PRIMARY KEY(`id`),
  CONSTRAINT `discordAccounts_userId_unique` UNIQUE(`userId`),
  CONSTRAINT `discordAccounts_discordId_unique` UNIQUE(`discordId`)
);

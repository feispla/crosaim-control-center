-- CROSAIM production foundation migration.
-- This migration is generated from the Drizzle 0006 baseline and then reviewed to
-- preserve existing applications. Do not apply it to a database that already ran
-- an unjournaled historical 0007/0008; baseline that database first.

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
);
--> statement-breakpoint
CREATE TABLE `auditRecords` (
  `id` int AUTO_INCREMENT NOT NULL,
  `eventId` varchar(64) NOT NULL,
  `actorUserId` int,
  `actorType` varchar(32) NOT NULL,
  `action` varchar(120) NOT NULL,
  `entityType` varchar(80) NOT NULL,
  `entityId` varchar(80),
  `beforeState` text,
  `afterState` text,
  `correlationId` varchar(80),
  `source` varchar(64) NOT NULL,
  `outcome` enum('allowed','denied','succeeded','failed') NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `auditRecords_id` PRIMARY KEY(`id`),
  CONSTRAINT `auditRecords_eventId_unique` UNIQUE(`eventId`)
);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE `userRoleAssignments` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `roleKey` enum('SUPER_ADMIN','ADMIN','MANAGER','COACH','SCOUT','CONTENT','PLAYER','TRYOUT','VIEWER') NOT NULL,
  `grantedByUserId` int,
  `source` varchar(64) NOT NULL DEFAULT 'control-center',
  `grantedAt` timestamp NOT NULL DEFAULT (now()),
  `revokedAt` timestamp,
  CONSTRAINT `userRoleAssignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
-- Expand before normalizing legacy labels, then contract to canonical states.
ALTER TABLE `applications` MODIFY COLUMN `status` enum('Pendiente','En revisión','Entrevista','Aprobada','Rechazada','POSTULACIÓN','REVISIÓN','ENTREVISTA','APROBADA','RECHAZADA','ROSTER','TRYOUT') NOT NULL DEFAULT 'POSTULACIÓN';
--> statement-breakpoint
UPDATE `applications` SET `status` = CASE `status`
  WHEN 'Pendiente' THEN 'POSTULACIÓN'
  WHEN 'En revisión' THEN 'REVISIÓN'
  WHEN 'Entrevista' THEN 'ENTREVISTA'
  WHEN 'Aprobada' THEN 'APROBADA'
  WHEN 'Rechazada' THEN 'RECHAZADA'
  ELSE `status`
END;
--> statement-breakpoint
ALTER TABLE `applications` MODIFY COLUMN `status` enum('POSTULACIÓN','REVISIÓN','ENTREVISTA','APROBADA','RECHAZADA','ROSTER','TRYOUT') NOT NULL DEFAULT 'POSTULACIÓN';
--> statement-breakpoint
ALTER TABLE `applications` ADD `trackingToken` varchar(64);
--> statement-breakpoint
ALTER TABLE `applications` ADD `publicLookupNumber` varchar(12);
--> statement-breakpoint
ALTER TABLE `applications` ADD `statusChangedAt` timestamp NOT NULL DEFAULT (now());
--> statement-breakpoint
ALTER TABLE `applications` ADD `statusChangedByUserId` int;
--> statement-breakpoint
-- Legacy values are opaque server-side identifiers and preserve all rows.
UPDATE `applications` SET `trackingToken` = concat('legacy-', `id`) WHERE `trackingToken` IS NULL;
--> statement-breakpoint
UPDATE `applications` SET `publicLookupNumber` = lpad(cast(`id` as char), 11, '0') WHERE `publicLookupNumber` IS NULL;
--> statement-breakpoint
ALTER TABLE `applications` MODIFY COLUMN `trackingToken` varchar(64) NOT NULL;
--> statement-breakpoint
ALTER TABLE `applications` MODIFY COLUMN `publicLookupNumber` varchar(12) NOT NULL;
--> statement-breakpoint
ALTER TABLE `applications` ADD CONSTRAINT `applications_trackingToken_unique` UNIQUE(`trackingToken`);
--> statement-breakpoint
ALTER TABLE `applications` ADD CONSTRAINT `applications_publicLookupNumber_unique` UNIQUE(`publicLookupNumber`);
--> statement-breakpoint
ALTER TABLE `discordEvents` MODIFY COLUMN `status` enum('pending','processing','sent','retry','dead_letter') NOT NULL DEFAULT 'pending';
--> statement-breakpoint
ALTER TABLE `discordEvents` ADD `nextAttemptAt` timestamp;
--> statement-breakpoint
ALTER TABLE `discordEvents` ADD `leaseToken` varchar(80);
--> statement-breakpoint
ALTER TABLE `discordEvents` ADD `leasedUntil` timestamp;
--> statement-breakpoint
ALTER TABLE `discordEvents` ADD `correlationId` varchar(80);

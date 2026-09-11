ALTER TABLE `applications` ADD `discordMessageId` varchar(40);--> statement-breakpoint
ALTER TABLE `applications` ADD CONSTRAINT `applications_discordMessageId_unique` UNIQUE(`discordMessageId`);
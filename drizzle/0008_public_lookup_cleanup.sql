ALTER TABLE `applications` ADD `publicLookupNumber` varchar(12);
--> statement-breakpoint
UPDATE `applications` SET `publicLookupNumber` = LPAD(`id`, 6, '0') WHERE `publicLookupNumber` IS NULL;
--> statement-breakpoint
ALTER TABLE `applications` MODIFY COLUMN `publicLookupNumber` varchar(12) NOT NULL;
--> statement-breakpoint
ALTER TABLE `applications` ADD CONSTRAINT `applications_publicLookupNumber_unique` UNIQUE(`publicLookupNumber`);
--> statement-breakpoint
UPDATE `rosterPlayers` SET `handle` = 'FEISPLA' WHERE LOWER(TRIM(`handle`)) IN ('prueba', 'pruebas', 'pruebaa');
--> statement-breakpoint
UPDATE `rosterPlayers` SET `handle` = 'OFFINE' WHERE LOWER(TRIM(`handle`)) IN ('offine', 'offline');
--> statement-breakpoint
DELETE FROM `applications` WHERE LOWER(TRIM(`playerName`)) IN ('feiss', 'feistv');

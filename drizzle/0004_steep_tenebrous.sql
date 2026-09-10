CREATE TABLE `pushAlertHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`adminUserId` int NOT NULL,
	`title` varchar(120) NOT NULL,
	`detail` text NOT NULL,
	`severity` enum('info','success','warning','urgent') NOT NULL,
	`targetMode` enum('all','user') NOT NULL,
	`recipientCount` int NOT NULL DEFAULT 0,
	`subscriptionCount` int NOT NULL DEFAULT 0,
	`deliveryStatus` enum('sent','partial','failed') NOT NULL,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pushAlertHistory_id` PRIMARY KEY(`id`)
);

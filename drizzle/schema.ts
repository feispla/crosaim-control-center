import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const applications = mysqlTable("applications", {
  id: int("id").autoincrement().primaryKey(),
  playerName: varchar("playerName", { length: 120 }).notNull(),
  discordUsername: varchar("discordUsername", { length: 120 }).notNull(),
  discordUserId: varchar("discordUserId", { length: 40 }),
  discordMessageId: varchar("discordMessageId", { length: 40 }).unique(),
  contact: varchar("contact", { length: 180 }),
  role: varchar("role", { length: 80 }).notNull(),
  rank: varchar("rank", { length: 80 }).notNull(),
  message: text("message").notNull(),
  status: mysqlEnum("status", ["Pendiente", "En revisión", "Entrevista", "Aprobada", "Rechazada"]).default("Pendiente").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  detail: text("detail").notNull(),
  severity: mysqlEnum("severity", ["info", "success", "warning", "urgent"]).default("info").notNull(),
  source: varchar("source", { length: 80 }).default("CROSAIM").notNull(),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const pushSubscriptions = mysqlTable("pushSubscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  endpoint: varchar("endpoint", { length: 768 }).notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const pushAlertHistory = mysqlTable("pushAlertHistory", {
  id: int("id").autoincrement().primaryKey(),
  adminUserId: int("adminUserId").notNull(),
  title: varchar("title", { length: 120 }).notNull(),
  detail: text("detail").notNull(),
  severity: mysqlEnum("severity", ["info", "success", "warning", "urgent"]).notNull(),
  targetMode: mysqlEnum("targetMode", ["all", "user"]).notNull(),
  recipientCount: int("recipientCount").default(0).notNull(),
  subscriptionCount: int("subscriptionCount").default(0).notNull(),
  deliveryStatus: mysqlEnum("deliveryStatus", ["sent", "partial", "failed"]).notNull(),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
});

export const rosterPlayers = mysqlTable("rosterPlayers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  handle: varchar("handle", { length: 120 }).notNull(),
  role: varchar("role", { length: 80 }).notNull(),
  rank: varchar("rank", { length: 80 }).notNull(),
  availability: varchar("availability", { length: 120 }).notNull(),
  status: mysqlEnum("status", ["Activo", "Tryout", "Pendiente"]).default("Pendiente").notNull(),
  source: mysqlEnum("source", ["Tracker.gg", "TPG", "CROSAIM", "Discord"]).default("CROSAIM").notNull(),
  color: varchar("color", { length: 16 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const contentItems = mysqlTable("contentItems", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  type: varchar("type", { length: 120 }).notNull(),
  platform: mysqlEnum("platform", ["Tracker.gg", "TikTok / Reels", "Discord"]).notNull(),
  status: mysqlEnum("status", ["Borrador", "Listo para publicar", "Publicado"]).default("Borrador").notNull(),
  accent: varchar("accent", { length: 16 }).notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const scheduleItems = mysqlTable("scheduleItems", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  time: varchar("time", { length: 5 }).notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  platform: mysqlEnum("platform", ["Tracker.gg", "TikTok / Reels", "Discord"]).notNull(),
  status: mysqlEnum("status", ["Planificada", "Publicada", "Borrador"]).default("Planificada").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const clips = mysqlTable("clips", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 180 }).notNull(),
  url: varchar("url", { length: 768 }).notNull(),
  size: int("size").notNull(),
  contentType: varchar("contentType", { length: 120 }).notNull(),
  status: mysqlEnum("status", ["Subido", "Vista previa local"]).default("Subido").notNull(),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
});

export const discordEvents = mysqlTable("discordEvents", {
  id: int("id").autoincrement().primaryKey(),
  eventType: varchar("eventType", { length: 40 }).notNull(),
  dedupeKey: varchar("dedupeKey", { length: 180 }).notNull().unique(),
  payload: text("payload").notNull(),
  status: mysqlEnum("status", ["pending", "sent", "failed"]).default("pending").notNull(),
  attempts: int("attempts").default(0).notNull(),
  lastError: text("lastError"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  processedAt: timestamp("processedAt"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Application = typeof applications.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type PushAlertHistory = typeof pushAlertHistory.$inferSelect;
export type RosterPlayer = typeof rosterPlayers.$inferSelect;
export type ContentItem = typeof contentItems.$inferSelect;
export type ScheduleItem = typeof scheduleItems.$inferSelect;
export type Clip = typeof clips.$inferSelect;
export type DiscordEvent = typeof discordEvents.$inferSelect;

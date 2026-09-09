import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { applications, clips, contentItems, InsertUser, notifications, pushSubscriptions, rosterPlayers, scheduleItems, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); } catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];
  const assignNullable = (field: TextField) => { const value = user[field]; if (value === undefined) return; const normalized = value ?? null; values[field] = normalized; updateSet[field] = normalized; };
  textFields.forEach(assignNullable);
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; } else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createApplication(input: typeof applications.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(applications).values(input);
  return { id: Number(result[0].insertId) };
}
export async function listApplications() { const db = await getDb(); if (!db) return []; return db.select().from(applications).orderBy(desc(applications.createdAt)); }
export async function updateApplicationStatus(id: number, status: typeof applications.$inferInsert.status) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); await db.update(applications).set({ status }).where(eq(applications.id, id)); }

export async function listNotifications(userId: number) { const db = await getDb(); if (!db) return []; return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(80); }
export async function createNotification(input: typeof notifications.$inferInsert) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); const result = await db.insert(notifications).values(input); return { id: Number(result[0].insertId) }; }
export async function toggleNotificationRead(userId: number, id: number, read: boolean) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); await db.update(notifications).set({ read }).where(and(eq(notifications.id, id), eq(notifications.userId, userId))); }
export async function deleteNotification(userId: number, id: number) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); await db.delete(notifications).where(and(eq(notifications.id, id), eq(notifications.userId, userId))); }
export async function savePushSubscription(input: typeof pushSubscriptions.$inferInsert) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); await db.insert(pushSubscriptions).values(input).onDuplicateKeyUpdate({ set: { userId: input.userId, p256dh: input.p256dh, auth: input.auth } }); }

export async function listRosterPlayers(userId: number) { const db = await getDb(); if (!db) return []; return db.select().from(rosterPlayers).where(eq(rosterPlayers.userId, userId)).orderBy(desc(rosterPlayers.createdAt)); }
export async function createRosterPlayer(input: typeof rosterPlayers.$inferInsert) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); const result = await db.insert(rosterPlayers).values(input); return { id: Number(result[0].insertId) }; }
export async function updateRosterPlayer(userId: number, id: number, input: Partial<Omit<typeof rosterPlayers.$inferInsert, "id" | "userId">>) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); await db.update(rosterPlayers).set(input).where(and(eq(rosterPlayers.id, id), eq(rosterPlayers.userId, userId))); }
export async function deleteRosterPlayer(userId: number, id: number) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); await db.delete(rosterPlayers).where(and(eq(rosterPlayers.id, id), eq(rosterPlayers.userId, userId))); }

export async function listContentItems(userId: number) { const db = await getDb(); if (!db) return []; return db.select().from(contentItems).where(eq(contentItems.userId, userId)).orderBy(desc(contentItems.createdAt)); }
export async function createContentItem(input: typeof contentItems.$inferInsert) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); const result = await db.insert(contentItems).values(input); return { id: Number(result[0].insertId) }; }
export async function updateContentItem(userId: number, id: number, input: Partial<Omit<typeof contentItems.$inferInsert, "id" | "userId">>) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); await db.update(contentItems).set(input).where(and(eq(contentItems.id, id), eq(contentItems.userId, userId))); }
export async function deleteContentItem(userId: number, id: number) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); await db.delete(contentItems).where(and(eq(contentItems.id, id), eq(contentItems.userId, userId))); }

export async function listScheduleItems(userId: number) { const db = await getDb(); if (!db) return []; return db.select().from(scheduleItems).where(eq(scheduleItems.userId, userId)).orderBy(scheduleItems.date, scheduleItems.time); }
export async function createScheduleItem(input: typeof scheduleItems.$inferInsert) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); const result = await db.insert(scheduleItems).values(input); return { id: Number(result[0].insertId) }; }
export async function updateScheduleItem(userId: number, id: number, input: Partial<Omit<typeof scheduleItems.$inferInsert, "id" | "userId">>) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); await db.update(scheduleItems).set(input).where(and(eq(scheduleItems.id, id), eq(scheduleItems.userId, userId))); }
export async function deleteScheduleItem(userId: number, id: number) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); await db.delete(scheduleItems).where(and(eq(scheduleItems.id, id), eq(scheduleItems.userId, userId))); }

export async function listClips(userId: number) { const db = await getDb(); if (!db) return []; return db.select().from(clips).where(eq(clips.userId, userId)).orderBy(desc(clips.uploadedAt)); }
export async function createClip(input: typeof clips.$inferInsert) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); const result = await db.insert(clips).values(input); return { id: Number(result[0].insertId) }; }
export async function deleteClip(userId: number, id: number) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); await db.delete(clips).where(and(eq(clips.id, id), eq(clips.userId, userId))); }

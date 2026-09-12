import { and, desc, eq, isNull, lte, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { applicationStateChanges, applications, auditRecords, clips, contentItems, discordAccounts, discordEvents, InsertUser, notifications, pushAlertHistory, pushSubscriptions, rosterPlayers, scheduleItems, userRoleAssignments, users } from "../drizzle/schema";
import type { ApplicationStatus } from "./applicationState";
import { ENV } from "./_core/env";
import { legacyRoleKey, type CrosaimRoleKey } from "@shared/rbac";
import { nanoid } from "nanoid";

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

export async function getUserByOpenId(openId: string) { const db = await getDb(); if (!db) return undefined; const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1); return result.length > 0 ? result[0] : undefined; }
export async function getEffectiveRoleKeys(user: { id: number; role: "user" | "admin" }): Promise<CrosaimRoleKey[]> {
  const db = await getDb();
  if (!db) return [legacyRoleKey(user.role)];
  const assignments = await db.select().from(userRoleAssignments).where(and(eq(userRoleAssignments.userId, user.id), isNull(userRoleAssignments.revokedAt)));
  const assigned = assignments.map(item => item.roleKey as CrosaimRoleKey);
  return assigned.length > 0 ? Array.from(new Set(assigned)) : [legacyRoleKey(user.role)];
}
export async function createAuditRecord(input: typeof auditRecords.$inferInsert) {
  const db = await getDb(); if (!db) return { id: 0 };
  const result = await db.insert(auditRecords).values(input);
  return { id: Number(result[0].insertId) };
}
export async function createApplication(input: typeof applications.$inferInsert) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); const result = await db.insert(applications).values(input); return { id: Number(result[0].insertId) }; }
export async function listApplications() { const db = await getDb(); if (!db) return []; return db.select().from(applications).orderBy(desc(applications.createdAt)); }
export async function getApplicationById(id: number) { const db = await getDb(); if (!db) return undefined; const result = await db.select().from(applications).where(eq(applications.id, id)).limit(1); return result[0]; }
export async function getApplicationByTrackingToken(token: string) { const db = await getDb(); if (!db) return undefined; const result = await db.select().from(applications).where(eq(applications.trackingToken, token)).limit(1); return result[0]; }
export async function getApplicationByPublicLookupNumber(publicLookupNumber: string) { const db = await getDb(); if (!db) return undefined; const result = await db.select().from(applications).where(eq(applications.publicLookupNumber, publicLookupNumber)).limit(1); return result[0]; }
export async function getApplicationByDiscordMessageId(discordMessageId: string) { const db = await getDb(); if (!db) return undefined; const result = await db.select().from(applications).where(eq(applications.discordMessageId, discordMessageId)).limit(1); return result[0]; }
export async function updateApplicationDiscordMessageId(id: number, discordMessageId: string) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); await db.update(applications).set({ discordMessageId }).where(eq(applications.id, id)); }
export async function transitionApplication(input: { applicationId: number; fromStatus: ApplicationStatus; toStatus: ApplicationStatus; actorUserId?: number | null; actorType: string; source: string; eventId: string }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const now = new Date();
  await db.transaction(async tx => {
    const updated = await tx.update(applications).set({ status: input.toStatus, statusChangedAt: now, statusChangedByUserId: input.actorUserId ?? null }).where(and(eq(applications.id, input.applicationId), eq(applications.status, input.fromStatus)));
    if (Number(updated[0].affectedRows) !== 1) throw new Error("Application state changed concurrently");
    await tx.insert(applicationStateChanges).values({ eventId: input.eventId, applicationId: input.applicationId, fromStatus: input.fromStatus, toStatus: input.toStatus, actorUserId: input.actorUserId ?? null, actorType: input.actorType, source: input.source });
    await tx.insert(auditRecords).values({ eventId: nanoid(24), actorUserId: input.actorUserId ?? null, actorType: input.actorType, action: "application.transition", entityType: "application", entityId: String(input.applicationId), beforeState: JSON.stringify({ status: input.fromStatus }), afterState: JSON.stringify({ status: input.toStatus, transitionEventId: input.eventId }), correlationId: input.eventId, source: input.source, outcome: "succeeded" });
  });
}

export async function transitionAndQueueApplication(input: { applicationId: number; fromStatus: ApplicationStatus; toStatus: ApplicationStatus; actorUserId?: number | null; actorType: string; source: string; eventId: string; eventType?: string; dedupeKey?: string; payload?: string }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const now = new Date();
  await db.transaction(async tx => {
    const updated = await tx.update(applications).set({ status: input.toStatus, statusChangedAt: now, statusChangedByUserId: input.actorUserId ?? null }).where(and(eq(applications.id, input.applicationId), eq(applications.status, input.fromStatus)));
    if (Number(updated[0].affectedRows) !== 1) throw new Error("Application state changed concurrently");
    await tx.insert(applicationStateChanges).values({ eventId: input.eventId, applicationId: input.applicationId, fromStatus: input.fromStatus, toStatus: input.toStatus, actorUserId: input.actorUserId ?? null, actorType: input.actorType, source: input.source });
    await tx.insert(auditRecords).values({ eventId: nanoid(24), actorUserId: input.actorUserId ?? null, actorType: input.actorType, action: "application.transition", entityType: "application", entityId: String(input.applicationId), beforeState: JSON.stringify({ status: input.fromStatus }), afterState: JSON.stringify({ status: input.toStatus, transitionEventId: input.eventId }), correlationId: input.eventId, source: input.source, outcome: "succeeded" });
    if (input.eventType && input.dedupeKey && input.payload) {
      await tx.insert(discordEvents).values({ eventType: input.eventType, dedupeKey: input.dedupeKey, payload: input.payload, status: "pending", attempts: 0, correlationId: input.eventId }).onDuplicateKeyUpdate({ set: { dedupeKey: input.dedupeKey } });
    }
  });
}
export async function deleteApplication(id: number) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); await db.delete(applications).where(eq(applications.id, id)); }
export async function createDiscordEvent(input: typeof discordEvents.$inferInsert) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); const result = await db.insert(discordEvents).values(input).onDuplicateKeyUpdate({ set: { dedupeKey: input.dedupeKey } }); return { id: Number(result[0].insertId || 0) }; }
const DISCORD_EVENT_LEASE_MS = 60_000;
const DISCORD_EVENT_MAX_ATTEMPTS = 8;

export async function claimDiscordEvents(limit = 20) {
  const db = await getDb(); if (!db) return [];
  const now = new Date();
  const candidates = await db.select().from(discordEvents).where(or(
    eq(discordEvents.status, "pending"),
    eq(discordEvents.status, "retry"),
    and(eq(discordEvents.status, "processing"), lte(discordEvents.leasedUntil, now)),
  )).orderBy(discordEvents.createdAt).limit(limit * 3);
  const claimed: Array<typeof discordEvents.$inferSelect> = [];
  for (const candidate of candidates) {
    if (claimed.length >= limit) break;
    if (candidate.status === "retry" && candidate.nextAttemptAt && candidate.nextAttemptAt > now) continue;
    const leaseToken = nanoid(32);
    const leasedUntil = new Date(now.getTime() + DISCORD_EVENT_LEASE_MS);
    const result = await db.update(discordEvents).set({
      status: "processing",
      attempts: candidate.attempts + 1,
      leaseToken,
      leasedUntil,
      nextAttemptAt: null,
      lastError: null,
    }).where(and(eq(discordEvents.id, candidate.id), eq(discordEvents.status, candidate.status), eq(discordEvents.attempts, candidate.attempts)));
    if (Number(result[0].affectedRows) === 1) {
      claimed.push({ ...candidate, status: "processing", attempts: candidate.attempts + 1, leaseToken, leasedUntil, nextAttemptAt: null, lastError: null });
    }
  }
  return claimed;
}

export async function markDiscordEventSent(id: number, leaseToken: string) {
  const db = await getDb(); if (!db) return false;
  const result = await db.update(discordEvents).set({ status: "sent", processedAt: new Date(), leaseToken: null, leasedUntil: null, nextAttemptAt: null }).where(and(eq(discordEvents.id, id), eq(discordEvents.status, "processing"), eq(discordEvents.leaseToken, leaseToken)));
  return Number(result[0].affectedRows) === 1;
}

export async function markDiscordEventFailed(id: number, leaseToken: string, error: string) {
  const db = await getDb(); if (!db) return false;
  const rows = await db.select().from(discordEvents).where(and(eq(discordEvents.id, id), eq(discordEvents.status, "processing"), eq(discordEvents.leaseToken, leaseToken))).limit(1);
  const event = rows[0];
  if (!event) return false;
  const exhausted = event.attempts >= DISCORD_EVENT_MAX_ATTEMPTS;
  const retryDelayMs = Math.min(300_000, 1_000 * (2 ** Math.max(0, event.attempts - 1)));
  const result = await db.update(discordEvents).set({
    status: exhausted ? "dead_letter" : "retry",
    lastError: error.slice(0, 1000),
    processedAt: exhausted ? new Date() : null,
    nextAttemptAt: exhausted ? null : new Date(Date.now() + retryDelayMs),
    leaseToken: null,
    leasedUntil: null,
  }).where(and(eq(discordEvents.id, id), eq(discordEvents.status, "processing"), eq(discordEvents.leaseToken, leaseToken)));
  return Number(result[0].affectedRows) === 1;
}

export async function upsertDiscordAccount(input: { openId: string; discordId: string; username: string; displayName?: string | null; avatarUrl?: string | null; inCrosaimGuild: boolean }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const user = await getUserByOpenId(input.openId); if (!user) throw new Error("Authenticated user not found");
  await db.insert(discordAccounts).values({ userId: user.id, discordId: input.discordId, username: input.username, displayName: input.displayName ?? null, avatarUrl: input.avatarUrl ?? null, inCrosaimGuild: input.inCrosaimGuild }).onDuplicateKeyUpdate({ set: { discordId: input.discordId, username: input.username, displayName: input.displayName ?? null, avatarUrl: input.avatarUrl ?? null, inCrosaimGuild: input.inCrosaimGuild } });
}
export async function getDiscordAccountByUserId(userId: number) { const db = await getDb(); if (!db) return undefined; const result = await db.select().from(discordAccounts).where(eq(discordAccounts.userId, userId)).limit(1); return result[0]; }

export async function listNotifications(userId: number) { const db = await getDb(); if (!db) return []; return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(80); }
export async function createNotification(input: typeof notifications.$inferInsert) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); const result = await db.insert(notifications).values(input); return { id: Number(result[0].insertId) }; }
export async function toggleNotificationRead(userId: number, id: number, read: boolean) { const db = await getDb(); if (!db) return; await db.update(notifications).set({ read }).where(and(eq(notifications.id, id), eq(notifications.userId, userId))); }
export async function deleteNotification(userId: number, id: number) { const db = await getDb(); if (!db) return; await db.delete(notifications).where(and(eq(notifications.id, id), eq(notifications.userId, userId))); }
export async function savePushSubscription(input: typeof pushSubscriptions.$inferInsert) { const db = await getDb(); if (!db) return; await db.insert(pushSubscriptions).values(input).onDuplicateKeyUpdate({ set: { userId: input.userId, p256dh: input.p256dh, auth: input.auth } }); }
export async function listPushSubscriptions(userId: number) { const db = await getDb(); if (!db) return []; return db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId)); }
export async function deletePushSubscription(endpoint: string) { const db = await getDb(); if (!db) return; await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint)); }
export async function listPushSubscribersForAdmin() { const db = await getDb(); if (!db) return []; return db.select({ id: pushSubscriptions.id, userId: pushSubscriptions.userId, userName: users.name, userEmail: users.email, subscribedAt: pushSubscriptions.createdAt }).from(pushSubscriptions).leftJoin(users, eq(pushSubscriptions.userId, users.id)).orderBy(desc(pushSubscriptions.createdAt)); }
export async function createPushAlertHistory(input: typeof pushAlertHistory.$inferInsert) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); const result = await db.insert(pushAlertHistory).values(input); return { id: Number(result[0].insertId) }; }
export async function listPushAlertHistory() { const db = await getDb(); if (!db) return []; return db.select().from(pushAlertHistory).orderBy(desc(pushAlertHistory.sentAt)).limit(100); }
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
export async function deleteScheduleItem(userId: number, id: number) { const db = await getDb(); if (!db) return; await db.delete(scheduleItems).where(and(eq(scheduleItems.id, id), eq(scheduleItems.userId, userId))); }
export async function listClips(userId: number) { const db = await getDb(); if (!db) return []; return db.select().from(clips).where(eq(clips.userId, userId)).orderBy(desc(clips.uploadedAt)); }
export async function createClip(input: typeof clips.$inferInsert) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); const result = await db.insert(clips).values(input); return { id: Number(result[0].insertId) }; }
export async function deleteClip(userId: number, id: number) { const db = await getDb(); if (!db) return; await db.delete(clips).where(and(eq(clips.id, id), eq(clips.userId, userId))); }

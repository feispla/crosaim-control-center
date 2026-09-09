import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createApplication, createClip, createContentItem, createNotification, createRosterPlayer, createScheduleItem,
  deleteClip, deleteContentItem, deleteNotification, deleteRosterPlayer, deleteScheduleItem, getUserByOpenId,
  listApplications, listClips, listContentItems, listNotifications, listPushSubscribersForAdmin, listRosterPlayers, listScheduleItems,
  savePushSubscription, toggleNotificationRead, updateApplicationStatus, updateContentItem, updateRosterPlayer, updateScheduleItem,
} from "./db";
import { ENV } from "./_core/env";
import { sendPushToUser } from "./push";
import { consumeRateLimit, isSameSiteRequest, requestIdentity } from "./security";

const applicationStatus = z.enum(["Pendiente", "En revisión", "Entrevista", "Aprobada", "Rechazada"]);
const notificationSeverity = z.enum(["info", "success", "warning", "urgent"]);
const platform = z.enum(["Tracker.gg", "TikTok / Reels", "Discord"]);
const rosterStatus = z.enum(["Activo", "Tryout", "Pendiente"]);
const rosterSource = z.enum(["Tracker.gg", "TPG", "CROSAIM", "Discord"]);
const contentStatus = z.enum(["Borrador", "Listo para publicar", "Publicado"]);
const scheduleStatus = z.enum(["Planificada", "Publicada", "Borrador"]);
const clipStatus = z.enum(["Subido", "Vista previa local"]);

const rosterInput = z.object({ handle: z.string().trim().min(2).max(120), role: z.string().trim().min(2).max(80), rank: z.string().trim().min(2).max(80), availability: z.string().trim().min(1).max(120), status: rosterStatus, source: rosterSource, color: z.string().regex(/^#[0-9a-fA-F]{6}$/) });
const contentInput = z.object({ title: z.string().trim().min(2).max(180), type: z.string().trim().min(2).max(120), platform, status: contentStatus, accent: z.string().regex(/^#[0-9a-fA-F]{6}$/), description: z.string().trim().min(2).max(3000) });
const scheduleInput = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), time: z.string().regex(/^\d{2}:\d{2}$/), title: z.string().trim().min(2).max(180), platform, status: scheduleStatus });
const clipInput = z.object({ name: z.string().trim().min(2).max(180), url: z.string().startsWith("/manus-storage/"), size: z.number().int().positive().max(262144000), contentType: z.string().startsWith("video/"), status: clipStatus });

export function formatRecruitingWebhook(input: { playerName: string; discordUsername: string; discordUserId?: string; role: string; rank: string; contact?: string; message: string }) {
  const discordIdentity = input.discordUserId ? `<@${input.discordUserId}>` : input.discordUsername;
  return `**NUEVA POSTULACIÓN CROSAIM**\n**Jugador:** ${input.playerName}\n**Discord:** ${discordIdentity} (${input.discordUsername})\n**Rol:** ${input.role}\n**Rango:** ${input.rank}\n**Contacto:** ${input.contact || "No indicado"}\n**Mensaje:** ${input.message}`;
}

async function sendRecruitingWebhook(input: { playerName: string; discordUsername: string; discordUserId?: string; role: string; rank: string; contact?: string; message: string }) {
  const webhookUrl = process.env.DISCORD_CROSAIM_WEBHOOK_URL;
  if (!webhookUrl) return;
  await fetch(webhookUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: formatRecruitingWebhook(input), allowed_mentions: { parse: [] } }) });
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => { const cookieOptions = getSessionCookieOptions(ctx.req); ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 }); return { success: true } as const; }),
  }),
  applications: router({
    submit: publicProcedure.input(z.object({ playerName: z.string().trim().min(2).max(120), discordUsername: z.string().trim().min(2).max(120), discordUserId: z.string().trim().max(40).optional(), contact: z.string().trim().max(180).optional(), role: z.string().trim().min(2).max(80), rank: z.string().trim().min(2).max(80), message: z.string().trim().min(10).max(3000), website: z.string().max(0).optional() })).mutation(async ({ ctx, input }) => { if (!isSameSiteRequest(ctx.req)) throw new TRPCError({ code: "FORBIDDEN", message: "Origen de formulario no autorizado" }); if (input.website) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid form submission" }); if (!consumeRateLimit(`application:${requestIdentity(ctx.req)}`, 3, 60 * 60 * 1000)) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Demasiadas postulaciones. Intenta nuevamente más tarde." }); const { website: _website, ...applicationInput } = input; const result = await createApplication(applicationInput); const owner = await getUserByOpenId(ENV.ownerOpenId); if (owner) { await createNotification({ userId: owner.id, title: "Nueva postulación recibida", detail: `${input.playerName} · ${input.role} · ${input.rank} · Discord: ${input.discordUsername}`, severity: "urgent", source: "Reclutamiento", read: false }); await sendPushToUser(owner.id, { title: "Nueva postulación CROSAIM", body: `${input.playerName} · ${input.role} · ${input.rank}`, tag: `application-${result.id}`, url: "/", requireInteraction: true }); } try { await sendRecruitingWebhook(applicationInput); } catch (error) { console.error("[Discord] Recruiting webhook failed", error); } return { ...result, message: "Postulación recibida. El equipo CROSAIM revisará tus datos." }; }),
    list: adminProcedure.query(() => listApplications()),
    updateStatus: adminProcedure.input(z.object({ id: z.number().int().positive(), status: applicationStatus })).mutation(async ({ input }) => { await updateApplicationStatus(input.id, input.status); return { success: true } as const; }),
  }),
  notifications: router({
    list: protectedProcedure.query(({ ctx }) => listNotifications(ctx.user.id)),
    create: protectedProcedure.input(z.object({ title: z.string().trim().min(2).max(180), detail: z.string().trim().min(2).max(3000), severity: notificationSeverity, source: z.string().trim().max(80).optional() })).mutation(async ({ ctx, input }) => { const result = await createNotification({ ...input, userId: ctx.user.id, read: false, source: input.source ?? "CROSAIM" }); if (input.severity === "urgent" || input.severity === "warning") await sendPushToUser(ctx.user.id, { title: input.title, body: input.detail, tag: `notification-${result.id}`, url: "/" }); return result; }),
    markRead: protectedProcedure.input(z.object({ id: z.number().int().positive(), read: z.boolean() })).mutation(({ ctx, input }) => toggleNotificationRead(ctx.user.id, input.id, input.read)),
    dismiss: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => deleteNotification(ctx.user.id, input.id)),
    subscribePush: protectedProcedure.input(z.object({ endpoint: z.string().url().max(768), p256dh: z.string().min(8), auth: z.string().min(4) })).mutation(({ ctx, input }) => savePushSubscription({ ...input, userId: ctx.user.id })),
  }),
  adminPush: router({
    subscribers: adminProcedure.query(async () => {
      const rows = await listPushSubscribersForAdmin();
      return rows.map((row) => ({ id: row.id, userId: row.userId, name: row.userName ?? "Cuenta sin nombre", email: row.userEmail ?? "Sin email", subscribedAt: row.subscribedAt }));
    }),
    send: adminProcedure.input(z.object({ title: z.string().trim().min(2).max(120), detail: z.string().trim().min(2).max(1000), severity: notificationSeverity, targetUserId: z.number().int().positive().nullable().optional() })).mutation(async ({ input }) => {
      const subscribers = await listPushSubscribersForAdmin();
      const targetIds = Array.from(new Set(subscribers.filter((row) => input.targetUserId == null || row.userId === input.targetUserId).map((row) => row.userId)));
      await Promise.all(targetIds.map(async (userId) => {
        await createNotification({ userId, title: input.title, detail: input.detail, severity: input.severity, source: "Panel admin", read: false });
        await sendPushToUser(userId, { title: input.title, body: input.detail, tag: `admin-${Date.now()}`, url: "/", requireInteraction: input.severity === "urgent" });
      }));
      return { recipients: targetIds.length, subscriptions: subscribers.filter((row) => input.targetUserId == null || row.userId === input.targetUserId).length };
    }),
  }),
  roster: router({
    list: protectedProcedure.query(({ ctx }) => listRosterPlayers(ctx.user.id)),
    create: protectedProcedure.input(rosterInput).mutation(({ ctx, input }) => createRosterPlayer({ ...input, userId: ctx.user.id })),
    update: protectedProcedure.input(z.object({ id: z.number().int().positive(), data: rosterInput.partial() })).mutation(({ ctx, input }) => updateRosterPlayer(ctx.user.id, input.id, input.data)),
    remove: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => deleteRosterPlayer(ctx.user.id, input.id)),
  }),
  content: router({
    list: protectedProcedure.query(({ ctx }) => listContentItems(ctx.user.id)),
    create: protectedProcedure.input(contentInput).mutation(({ ctx, input }) => createContentItem({ ...input, userId: ctx.user.id })),
    update: protectedProcedure.input(z.object({ id: z.number().int().positive(), data: contentInput.partial() })).mutation(({ ctx, input }) => updateContentItem(ctx.user.id, input.id, input.data)),
    remove: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => deleteContentItem(ctx.user.id, input.id)),
  }),
  calendar: router({
    list: protectedProcedure.query(({ ctx }) => listScheduleItems(ctx.user.id)),
    create: protectedProcedure.input(scheduleInput).mutation(({ ctx, input }) => createScheduleItem({ ...input, userId: ctx.user.id })),
    update: protectedProcedure.input(z.object({ id: z.number().int().positive(), data: scheduleInput.partial() })).mutation(({ ctx, input }) => updateScheduleItem(ctx.user.id, input.id, input.data)),
    remove: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => deleteScheduleItem(ctx.user.id, input.id)),
  }),
  clips: router({
    list: protectedProcedure.query(({ ctx }) => listClips(ctx.user.id)),
    create: protectedProcedure.input(clipInput).mutation(({ ctx, input }) => createClip({ ...input, userId: ctx.user.id })),
    remove: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => deleteClip(ctx.user.id, input.id)),
  }),
  workspace: router({
    importLocal: protectedProcedure.input(z.object({ roster: z.array(rosterInput).max(100), content: z.array(contentInput).max(100), calendar: z.array(scheduleInput).max(200), clips: z.array(clipInput).max(200) })).mutation(async ({ ctx, input }) => {
      const existing = await Promise.all([listRosterPlayers(ctx.user.id), listContentItems(ctx.user.id), listScheduleItems(ctx.user.id), listClips(ctx.user.id)]);
      if (existing.some((items) => items.length > 0)) return { imported: false, reason: "workspace-not-empty" } as const;
      await Promise.all(input.roster.map((item) => createRosterPlayer({ ...item, userId: ctx.user.id })));
      await Promise.all(input.content.map((item) => createContentItem({ ...item, userId: ctx.user.id })));
      await Promise.all(input.calendar.map((item) => createScheduleItem({ ...item, userId: ctx.user.id })));
      await Promise.all(input.clips.map((item) => createClip({ ...item, userId: ctx.user.id })));
      return { imported: true, reason: "local-workspace-migrated" } as const;
    }),
  }),
});

export type AppRouter = typeof appRouter;

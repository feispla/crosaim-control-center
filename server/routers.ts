import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createApplication, createClip, createContentItem, createNotification, createRosterPlayer, createScheduleItem,
  deleteClip, deleteContentItem, deleteNotification, deleteRosterPlayer, deleteScheduleItem, getUserByOpenId,
  listApplications, listClips, listContentItems, listNotifications, listRosterPlayers, listScheduleItems,
  savePushSubscription, toggleNotificationRead, updateApplicationStatus, updateContentItem, updateRosterPlayer, updateScheduleItem,
} from "./db";
import { ENV } from "./_core/env";

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
    submit: publicProcedure.input(z.object({ playerName: z.string().trim().min(2).max(120), discordUsername: z.string().trim().min(2).max(120), discordUserId: z.string().trim().max(40).optional(), contact: z.string().trim().max(180).optional(), role: z.string().trim().min(2).max(80), rank: z.string().trim().min(2).max(80), message: z.string().trim().min(10).max(3000) })).mutation(async ({ input }) => { const result = await createApplication(input); const owner = await getUserByOpenId(ENV.ownerOpenId); if (owner) await createNotification({ userId: owner.id, title: "Nueva postulación recibida", detail: `${input.playerName} · ${input.role} · ${input.rank} · Discord: ${input.discordUsername}`, severity: "urgent", source: "Reclutamiento", read: false }); try { await sendRecruitingWebhook(input); } catch (error) { console.error("[Discord] Recruiting webhook failed", error); } return { ...result, message: "Postulación recibida. El equipo CROSAIM revisará tus datos." }; }),
    list: adminProcedure.query(() => listApplications()),
    updateStatus: adminProcedure.input(z.object({ id: z.number().int().positive(), status: applicationStatus })).mutation(async ({ input }) => { await updateApplicationStatus(input.id, input.status); return { success: true } as const; }),
  }),
  notifications: router({
    list: protectedProcedure.query(({ ctx }) => listNotifications(ctx.user.id)),
    create: protectedProcedure.input(z.object({ title: z.string().trim().min(2).max(180), detail: z.string().trim().min(2).max(3000), severity: notificationSeverity, source: z.string().trim().max(80).optional() })).mutation(({ ctx, input }) => createNotification({ ...input, userId: ctx.user.id, read: false, source: input.source ?? "CROSAIM" })),
    markRead: protectedProcedure.input(z.object({ id: z.number().int().positive(), read: z.boolean() })).mutation(({ ctx, input }) => toggleNotificationRead(ctx.user.id, input.id, input.read)),
    dismiss: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => deleteNotification(ctx.user.id, input.id)),
    subscribePush: protectedProcedure.input(z.object({ endpoint: z.string().url().max(768), p256dh: z.string().min(8), auth: z.string().min(4) })).mutation(({ ctx, input }) => savePushSubscription({ ...input, userId: ctx.user.id })),
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

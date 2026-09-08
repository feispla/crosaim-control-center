import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { createApplication, createNotification, deleteNotification, getUserByOpenId, listApplications, listNotifications, savePushSubscription, toggleNotificationRead, updateApplicationStatus } from "./db";
import { ENV } from "./_core/env";

const applicationStatus = z.enum(["Pendiente", "En revisión", "Entrevista", "Aprobada", "Rechazada"]);
const notificationSeverity = z.enum(["info", "success", "warning", "urgent"]);

export function formatRecruitingWebhook(input: { playerName: string; discordUsername: string; discordUserId?: string; role: string; rank: string; contact?: string; message: string }) {
  const discordIdentity = input.discordUserId ? `<@${input.discordUserId}>` : input.discordUsername;
  return `**NUEVA POSTULACIÓN CROSAIM**\n**Jugador:** ${input.playerName}\n**Discord:** ${discordIdentity} (${input.discordUsername})\n**Rol:** ${input.role}\n**Rango:** ${input.rank}\n**Contacto:** ${input.contact || "No indicado"}\n**Mensaje:** ${input.message}`;
}

async function sendRecruitingWebhook(input: { playerName: string; discordUsername: string; discordUserId?: string; role: string; rank: string; contact?: string; message: string }) {
  const webhookUrl = process.env.DISCORD_CROSAIM_WEBHOOK_URL;
  if (!webhookUrl) return;
  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: formatRecruitingWebhook(input),
      allowed_mentions: { parse: [] },
    }),
  });
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  applications: router({
    submit: publicProcedure.input(z.object({
      playerName: z.string().trim().min(2).max(120),
      discordUsername: z.string().trim().min(2).max(120),
      discordUserId: z.string().trim().max(40).optional(),
      contact: z.string().trim().max(180).optional(),
      role: z.string().trim().min(2).max(80),
      rank: z.string().trim().min(2).max(80),
      message: z.string().trim().min(10).max(3000),
    })).mutation(async ({ input }) => {
      const result = await createApplication(input);
      const owner = await getUserByOpenId(ENV.ownerOpenId);
      if (owner) {
        await createNotification({ userId: owner.id, title: "Nueva postulación recibida", detail: `${input.playerName} · ${input.role} · ${input.rank} · Discord: ${input.discordUsername}`, severity: "urgent", source: "Reclutamiento", read: false });
      }
      try { await sendRecruitingWebhook(input); } catch (error) { console.error("[Discord] Recruiting webhook failed", error); }
      return { ...result, message: "Postulación recibida. El equipo CROSAIM revisará tus datos." };
    }),
    list: adminProcedure.query(() => listApplications()),
    updateStatus: adminProcedure.input(z.object({ id: z.number().int().positive(), status: applicationStatus })).mutation(async ({ input }) => {
      await updateApplicationStatus(input.id, input.status);
      return { success: true } as const;
    }),
  }),
  notifications: router({
    list: protectedProcedure.query(({ ctx }) => listNotifications(ctx.user.id)),
    create: protectedProcedure.input(z.object({ title: z.string().trim().min(2).max(180), detail: z.string().trim().min(2).max(3000), severity: notificationSeverity, source: z.string().trim().max(80).optional() })).mutation(({ ctx, input }) => createNotification({ ...input, userId: ctx.user.id, read: false, source: input.source ?? "CROSAIM" })),
    markRead: protectedProcedure.input(z.object({ id: z.number().int().positive(), read: z.boolean() })).mutation(({ ctx, input }) => toggleNotificationRead(ctx.user.id, input.id, input.read)),
    dismiss: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => deleteNotification(ctx.user.id, input.id)),
    subscribePush: protectedProcedure.input(z.object({ endpoint: z.string().url().max(768), p256dh: z.string().min(8), auth: z.string().min(4) })).mutation(({ ctx, input }) => savePushSubscription({ ...input, userId: ctx.user.id })),
  }),
});

export type AppRouter = typeof appRouter;

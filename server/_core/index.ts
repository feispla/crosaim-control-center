import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { nanoid } from "nanoid";
import { registerOAuthRoutes } from "./oauth";
import { registerDiscordOAuthRoutes } from "../discordOAuth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { storagePut } from "../storage";
import { sdk } from "./sdk";
import { allowedClipTypes, consumeRateLimit, isSameSiteRequest, MAX_CLIP_BYTES, requestIdentity, safeClipName } from "../security";
import { createApplication, getApplicationByDiscordMessageId, listApplications, listPendingDiscordEvents, markDiscordEventFailed, markDiscordEventSent, updateApplicationDiscordMessageId } from "../db";
import { getTrackerProfile, trackerSupportedTitles } from "../statsProviders";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  registerDiscordOAuthRoutes(app);

  app.get("/api/tracker/profile", async (req, res) => {
    const botToken = process.env.DISCORD_TRACKER_BOT_TOKEN;
    if (!botToken || req.header("x-crosaim-tracker-bot-token") !== botToken) return res.status(401).json({ error: "tracker-bot-not-authorized" });
    const title = typeof req.query.title === "string" ? req.query.title : "";
    const platform = typeof req.query.platform === "string" ? req.query.platform : "";
    const player = typeof req.query.player === "string" ? req.query.player : "";
    if (!trackerSupportedTitles.includes(title as typeof trackerSupportedTitles[number]) || !platform || player.trim().length < 2 || player.length > 120) return res.status(400).json({ error: "invalid-tracker-query" });
    try { return res.json(await getTrackerProfile({ title: title as typeof trackerSupportedTitles[number], platform, player })); }
    catch (error) { return res.status(502).json({ error: error instanceof Error ? error.message : "tracker-unavailable" }); }
  });

  app.get("/api/discord/widget", async (_req, res) => {
    try {
      const response = await fetch("https://discord.com/api/guilds/1546641331927908472/widget.json");
      if (!response.ok) return res.status(502).json({ error: "discord-widget-unavailable" });
      const widget = await response.json() as {
        id?: string;
        name?: string;
        instant_invite?: string | null;
        channels?: Array<{ id: string; name: string; position: number }>;
        members?: Array<{ id: string; username: string; status: string; avatar_url?: string; game?: { name?: string } }>;
        presence_count?: number;
      };
      return res.json({
        id: widget.id,
        name: widget.name,
        instantInvite: widget.instant_invite ?? null,
        channels: (widget.channels ?? []).sort((a, b) => a.position - b.position).slice(0, 8),
        members: (widget.members ?? []).slice(0, 16).map(member => ({
          id: member.id,
          username: member.username,
          status: member.status,
          avatarUrl: member.avatar_url ?? null,
          game: member.game?.name ?? null,
        })),
        presenceCount: widget.presence_count ?? widget.members?.length ?? 0,
      });
    } catch (error) {
      console.error("[Discord] Widget fetch failed", error);
      return res.status(502).json({ error: "discord-widget-unavailable" });
    }
  });

  app.get("/api/discord/events", async (req, res) => {
    const syncSecret = process.env.CROSAIM_BOT_SYNC_SECRET;
    if (!syncSecret || req.header("x-crosaim-sync-secret") !== syncSecret) return res.status(401).json({ error: "sync-not-authorized" });
    try { return res.json(await listPendingDiscordEvents(20)); } catch (error) { console.error("[Discord] Event polling failed", error); return res.status(500).json({ error: "sync-unavailable" }); }
  });

  app.post("/api/discord/events/:id/ack", express.json({ limit: "8kb" }), async (req, res) => {
    const syncSecret = process.env.CROSAIM_BOT_SYNC_SECRET;
    if (!syncSecret || req.header("x-crosaim-sync-secret") !== syncSecret) return res.status(401).json({ error: "sync-not-authorized" });
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "invalid-event-id" });
    try {
      if (req.body?.ok === true) await markDiscordEventSent(id);
      else await markDiscordEventFailed(id, typeof req.body?.error === "string" ? req.body.error : "Discord delivery failed");
      return res.status(204).send();
    } catch (error) { console.error("[Discord] Event acknowledgement failed", error); return res.status(500).json({ error: "ack-unavailable" }); }
  });

  app.post("/api/discord/applications", express.json({ limit: "32kb" }), async (req, res) => {
    const syncSecret = process.env.CROSAIM_BOT_SYNC_SECRET;
    if (!syncSecret || req.header("x-crosaim-sync-secret") !== syncSecret) return res.status(401).json({ error: "sync-not-authorized" });
    const body = req.body ?? {};
    const discordMessageId = typeof body.discordMessageId === "string" ? body.discordMessageId.trim().slice(0, 40) : "";
    const playerName = typeof body.playerName === "string" ? body.playerName.trim().slice(0, 120) : "";
    const discordUsername = typeof body.discordUsername === "string" ? body.discordUsername.trim().slice(0, 120) : "";
    const role = typeof body.role === "string" ? body.role.trim().slice(0, 80) : "";
    const rank = typeof body.rank === "string" ? body.rank.trim().slice(0, 80) : "";
    const message = typeof body.message === "string" ? body.message.trim().slice(0, 3000) : "";
    if (!discordMessageId || playerName.length < 2 || discordUsername.length < 2 || role.length < 2 || rank.length < 2 || message.length < 2) return res.status(400).json({ error: "invalid-application-data" });
    try {
      const existingByMessage = await getApplicationByDiscordMessageId(discordMessageId);
      if (existingByMessage) return res.json({ created: false, application: existingByMessage });
      const existing = (await listApplications()).find((item) => item.playerName.trim().toLowerCase() === playerName.toLowerCase() && item.discordUsername.trim().replace(/^@/, "").toLowerCase() === discordUsername.replace(/^@/, "").toLowerCase() && item.message.trim() === message);
      if (existing) { if (!existing.discordMessageId) await updateApplicationDiscordMessageId(existing.id, discordMessageId); return res.json({ created: false, application: existing }); }
      const result = await createApplication({ playerName, discordUsername, discordUserId: typeof body.discordUserId === "string" ? body.discordUserId.trim().slice(0, 40) || null : null, contact: typeof body.contact === "string" ? body.contact.trim().slice(0, 180) || null : null, role, rank, message, discordMessageId, trackingToken: nanoid(18), status: "POSTULACIÓN", statusChangedAt: new Date() });
      return res.status(201).json({ created: true, id: result.id });
    } catch (error) { console.error("[Discord] Application sync failed", error); return res.status(500).json({ error: "application-sync-failed" }); }
  });

  app.post(
    "/api/clips/upload",
    express.raw({ type: "*/*", limit: "120mb" }),
    async (req, res) => {
      try {
        if (!isSameSiteRequest(req)) return res.status(403).json({ error: "invalid-origin" });
        try { await sdk.authenticateRequest(req); } catch { return res.status(401).json({ error: "upload-auth-required" }); }
        if (!consumeRateLimit(`clip-upload:${requestIdentity(req)}`, 5)) return res.status(429).json({ error: "upload-rate-limit" });
        const buffer = Buffer.isBuffer(req.body) ? req.body : null;
        if (!buffer || buffer.length === 0) {
          return res.status(400).json({ error: "empty-video" });
        }
        if (buffer.length > MAX_CLIP_BYTES) return res.status(413).json({ error: "video-too-large" });
        const contentType = String(req.headers["content-type"] || "video/mp4").split(";")[0];
        if (!allowedClipTypes.has(contentType)) {
          return res.status(415).json({ error: "video-only" });
        }
        const rawHeaderName = String(req.headers["x-file-name"] || "crosaim-clip.mp4");
        const filename = safeClipName(rawHeaderName);
        const uploaded = await storagePut(`crosaim/clips/${Date.now()}-${filename}`, buffer, contentType);
        const forwardedProto = req.header("x-forwarded-proto")?.split(",")[0]?.trim() || req.protocol;
        const forwardedHost = req.header("x-forwarded-host")?.split(",")[0]?.trim() || req.header("host");
        const publicUrl = forwardedHost ? `${forwardedProto}://${forwardedHost}${uploaded.url}` : uploaded.url;
        return res.status(201).json({ ...uploaded, name: filename, size: buffer.length, contentType });
      } catch (error) {
        console.error("[Clips] Upload failed", error);
        return res.status(500).json({ error: "upload-failed" });
      }
    },
  );

  app.post(
    "/api/discord/notice",
    express.json({ limit: "32kb" }),
    async (req, res) => {
      try {
        await sdk.authenticateRequest(req);
        if (!isSameSiteRequest(req)) return res.status(403).json({ error: "invalid-origin" });
        if (!consumeRateLimit(`discord-notice:${requestIdentity(req)}`, 10, 5 * 60 * 1000)) return res.status(429).json({ error: "notice-rate-limit" });
        const message = typeof req.body?.message === "string" ? req.body.message.trim().slice(0, 1800) : "";
        if (!message) return res.status(400).json({ error: "message-required" });
        const webhookUrl = process.env.DISCORD_CROSAIM_WEBHOOK_URL;
        if (!webhookUrl) return res.status(503).json({ error: "discord-not-configured" });
        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: `**CROSAIM · AVISO DE EQUIPO**\n${message}`, allowed_mentions: { parse: [] } }),
        });
        if (!response.ok) return res.status(502).json({ error: "discord-delivery-failed" });
        return res.status(204).send();
      } catch (error) {
        console.error("[Discord] Notice failed", error);
        return res.status(401).json({ error: "discord-auth-required" });
      }
    },
  );

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);

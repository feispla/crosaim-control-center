import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { storagePut } from "../storage";
import { sdk } from "./sdk";

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

  app.post(
    "/api/clips/upload",
    express.raw({ type: "*/*", limit: "250mb" }),
    async (req, res) => {
      try {
        const buffer = Buffer.isBuffer(req.body) ? req.body : null;
        if (!buffer || buffer.length === 0) {
          return res.status(400).json({ error: "empty-video" });
        }
        const contentType = String(req.headers["content-type"] || "video/mp4").split(";")[0];
        if (!contentType.startsWith("video/")) {
          return res.status(415).json({ error: "video-only" });
        }
        const rawHeaderName = String(req.headers["x-file-name"] || "crosaim-clip.mp4");
        const rawName = decodeURIComponent(rawHeaderName);
        const safeName = rawName.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-90) || "crosaim-clip.mp4";
        const uploaded = await storagePut(`crosaim/clips/${Date.now()}-${safeName}`, buffer, contentType);
        return res.status(201).json({ ...uploaded, name: safeName, size: buffer.length, contentType });
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

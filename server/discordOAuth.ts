import crypto from "crypto";
import { parse as parseCookieHeader } from "cookie";
import type { Express, Request, Response } from "express";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { upsertDiscordAccount } from "./db";

const DISCORD_AUTHORIZE_URL = "https://discord.com/oauth2/authorize";
const DISCORD_TOKEN_URL = "https://discord.com/api/oauth2/token";
const DISCORD_API_URL = "https://discord.com/api/v10";
const STATE_COOKIE = "__Host-crosaim-discord-state";
const STATE_TTL_SECONDS = 10 * 60;
const CROSAIM_GUILD_ID = process.env.DISCORD_GUILD_ID || "1546641331927908472";

type DiscordUser = { id: string; username: string; global_name?: string | null; avatar?: string | null };
type DiscordGuild = { id: string; name: string; permissions?: string };

function environment() {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const publicBaseUrl = process.env.CROSAIM_PUBLIC_BASE_URL;
  if (!clientId || !clientSecret || !publicBaseUrl) return null;
  return { clientId, clientSecret, redirectUri: `${publicBaseUrl.replace(/\/$/, "")}/api/discord/oauth/callback` };
}

function secureCookie(req: Request) {
  return { ...getSessionCookieOptions(req), sameSite: "lax" as const, maxAge: STATE_TTL_SECONDS * 1000 };
}

function clearStateCookie(req: Request, res: Response) {
  res.clearCookie(STATE_COOKIE, { ...secureCookie(req), maxAge: -1 });
}

function avatarUrl(user: DiscordUser) {
  return user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128` : null;
}

async function getJson<T>(path: string, accessToken: string): Promise<T> {
  const response = await fetch(`${DISCORD_API_URL}${path}`, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!response.ok) throw new Error(`Discord API ${path} returned ${response.status}`);
  return response.json() as Promise<T>;
}

/**
 * Web login and account link use OAuth authorization-code grant. Bot installation
 * remains a separate Discord bot invite and never reuses a user access token.
 */
export function registerDiscordOAuthRoutes(app: Express) {
  app.get("/api/discord/oauth/start", async (req, res) => {
    const config = environment();
    if (!config) return res.status(503).json({ error: "discord-oauth-not-configured" });
    try {
      const user = await sdk.authenticateRequest(req);
      const state = crypto.randomBytes(32).toString("base64url");
      res.cookie(STATE_COOKIE, JSON.stringify({ state, openId: user.openId }), secureCookie(req));
      const url = new URL(DISCORD_AUTHORIZE_URL);
      url.searchParams.set("client_id", config.clientId);
      url.searchParams.set("response_type", "code");
      url.searchParams.set("redirect_uri", config.redirectUri);
      url.searchParams.set("scope", "identify guilds guilds.members.read");
      url.searchParams.set("state", state);
      url.searchParams.set("prompt", "consent");
      return res.redirect(url.toString());
    } catch {
      return res.status(401).json({ error: "discord-link-auth-required" });
    }
  });

  app.get("/api/discord/oauth/callback", async (req, res) => {
    const config = environment();
    const code = typeof req.query.code === "string" ? req.query.code : "";
    const state = typeof req.query.state === "string" ? req.query.state : "";
    const cookie = parseCookieHeader(req.headers.cookie ?? "")[STATE_COOKIE] ?? "";
    if (!config || !code || !state || !cookie) return res.status(400).send("No se pudo validar la vinculación con Discord.");
    try {
      const stored = JSON.parse(cookie) as { state?: string; openId?: string };
      if (!stored.state || !stored.openId || !crypto.timingSafeEqual(Buffer.from(stored.state), Buffer.from(state))) {
        clearStateCookie(req, res);
        return res.status(403).send("Estado OAuth inválido.");
      }
      clearStateCookie(req, res);
      const basic = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64");
      const tokenResponse = await fetch(DISCORD_TOKEN_URL, {
        method: "POST",
        headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: config.redirectUri }),
      });
      if (!tokenResponse.ok) throw new Error(`Discord token exchange returned ${tokenResponse.status}`);
      const token = await tokenResponse.json() as { access_token: string };
      const [discordUser, guilds] = await Promise.all([
        getJson<DiscordUser>("/users/@me", token.access_token),
        getJson<DiscordGuild[]>("/users/@me/guilds", token.access_token),
      ]);
      await upsertDiscordAccount({
        openId: stored.openId,
        discordId: discordUser.id,
        username: discordUser.username,
        displayName: discordUser.global_name ?? null,
        avatarUrl: avatarUrl(discordUser),
        inCrosaimGuild: guilds.some((guild) => guild.id === CROSAIM_GUILD_ID),
      });
      return res.redirect("/community?discord=linked");
    } catch (error) {
      console.error("[Discord OAuth] callback failed", error);
      return res.status(502).send("Discord no pudo completar la vinculación. Inténtalo de nuevo.");
    }
  });
}

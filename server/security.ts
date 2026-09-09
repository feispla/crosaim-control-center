import type { Request } from "express";

const buckets = new Map<string, { count: number; resetAt: number }>();
const DEFAULT_WINDOW_MS = 15 * 60 * 1000;

function forwardedIp(req: Request) {
  const forwarded = req.header("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || req.ip || req.socket.remoteAddress || "unknown";
}

export function requestIdentity(req: Request, userId?: number) {
  return userId ? `user:${userId}` : `ip:${forwardedIp(req)}`;
}

export function consumeRateLimit(key: string, limit: number, windowMs = DEFAULT_WINDOW_MS) {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}

export function isSameSiteRequest(req: Request) {
  const origin = req.header("origin");
  if (!origin) return true;
  try {
    const originUrl = new URL(origin);
    const host = req.header("x-forwarded-host")?.split(",")[0]?.trim() || req.header("host");
    return Boolean(host && originUrl.host === host);
  } catch {
    return false;
  }
}

export const allowedClipTypes = new Set(["video/mp4", "video/webm", "video/quicktime", "video/x-matroska"]);
export const MAX_CLIP_BYTES = 120 * 1024 * 1024;

export function safeClipName(value: string) {
  const decoded = decodeURIComponent(value);
  const basename = decoded.split(/[\\/]/).pop() ?? "crosaim-clip.mp4";
  return basename.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-90) || "crosaim-clip.mp4";
}

export function resetRateLimitStateForTests() {
  buckets.clear();
}

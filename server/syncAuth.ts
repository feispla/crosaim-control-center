import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { Request } from "express";

const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;
const seenNonces = new Map<string, number>();

export function resetSyncAuthStateForTests() {
  seenNonces.clear();
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function pruneNonces(now: number) {
  for (const [nonce, expiresAt] of seenNonces) {
    if (expiresAt <= now) seenNonces.delete(nonce);
  }
}

export function syncRequestSignature(input: { secret: string; method: string; path: string; timestamp: string; nonce: string; bodyHash: string }): string {
  const payload = [input.method.toUpperCase(), input.path, input.timestamp, input.nonce, input.bodyHash].join("\n");
  return createHmac("sha256", input.secret).update(payload, "utf8").digest("hex");
}

export function verifyBotSyncRequest(req: Request): boolean {
  const secret = process.env.CROSAIM_BOT_SYNC_SECRET;
  if (!secret) return false;
  const signedRequired = process.env.CROSAIM_SIGNED_SYNC_REQUIRED !== "false";
  if (!signedRequired) return safeEqual(req.header("x-crosaim-sync-secret") ?? "", secret);

  const timestamp = req.header("x-crosaim-sync-timestamp") ?? "";
  const nonce = req.header("x-crosaim-sync-nonce") ?? "";
  const bodyHash = req.header("x-crosaim-sync-body-sha256") ?? "";
  const suppliedSignature = req.header("x-crosaim-sync-signature") ?? "";
  const keyId = req.header("x-crosaim-sync-key-id") ?? "";
  if (keyId !== "v1" || !/^\d{13}$/.test(timestamp) || !/^[a-f0-9]{64}$/i.test(bodyHash) || nonce.length < 16 || nonce.length > 120 || !/^[a-f0-9]{64}$/i.test(suppliedSignature)) return false;

  const now = Date.now();
  if (Math.abs(now - Number(timestamp)) > MAX_CLOCK_SKEW_MS) return false;
  pruneNonces(now);
  if (seenNonces.has(nonce)) return false;

  const serializedBody = req.method === "GET" || req.method === "HEAD" ? "" : JSON.stringify(req.body ?? {});
  const expectedBodyHash = createHash("sha256").update(serializedBody, "utf8").digest("hex");
  if (!safeEqual(bodyHash, expectedBodyHash)) return false;

  const expectedSignature = syncRequestSignature({ secret, method: req.method, path: req.path, timestamp, nonce, bodyHash });
  if (!safeEqual(suppliedSignature, expectedSignature)) return false;
  seenNonces.set(nonce, now + MAX_CLOCK_SKEW_MS);
  return true;
}

import { beforeEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { hasCapability, legacyRoleKey, ROLE_CAPABILITIES } from "@shared/rbac";
import { resetSyncAuthStateForTests, syncRequestSignature, verifyBotSyncRequest } from "./syncAuth";

function signedRequest(input: { method: string; path: string; body: Record<string, unknown>; nonce: string; timestamp?: string }) {
  const secret = process.env.CROSAIM_BOT_SYNC_SECRET!;
  const timestamp = input.timestamp ?? String(Date.now());
  const serialized = input.method === "GET" ? "" : JSON.stringify(input.body);
  const bodyHash = (awaitableHash(serialized));
  const signature = syncRequestSignature({ secret, method: input.method, path: input.path, timestamp, nonce: input.nonce, bodyHash });
  const headers: Record<string, string> = {
    "x-crosaim-sync-key-id": "v1",
    "x-crosaim-sync-timestamp": timestamp,
    "x-crosaim-sync-nonce": input.nonce,
    "x-crosaim-sync-body-sha256": bodyHash,
    "x-crosaim-sync-signature": signature,
  };
  return {
    method: input.method,
    path: input.path,
    body: input.body,
    header(name: string) { return headers[name.toLowerCase()]; },
  } as never;
}

function awaitableHash(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

describe("CROSAIM RBAC contract", () => {
  it("maps legacy accounts conservatively and denies review to viewers", () => {
    expect(legacyRoleKey("admin")).toBe("SUPER_ADMIN");
    expect(legacyRoleKey("user")).toBe("VIEWER");
    expect(hasCapability(["MANAGER"], "applications.review")).toBe(true);
    expect(hasCapability(["VIEWER"], "applications.review")).toBe(false);
    expect(ROLE_CAPABILITIES.CONTENT).toEqual(["dashboard.view", "content.publish"]);
  });
});

describe("signed bot synchronization", () => {
  beforeEach(() => {
    process.env.CROSAIM_BOT_SYNC_SECRET = "test-sync-secret";
    delete process.env.CROSAIM_SIGNED_SYNC_REQUIRED;
    resetSyncAuthStateForTests();
  });

  it("accepts a valid signed request once and rejects its replay", () => {
    const request = signedRequest({ method: "POST", path: "/api/discord/events/1/ack", body: { ok: true, leaseToken: "lease-token-123456" }, nonce: "0123456789abcdef0123456789abcdef" });
    expect(verifyBotSyncRequest(request)).toBe(true);
    expect(verifyBotSyncRequest(request)).toBe(false);
  });

  it("rejects a stale timestamp and a changed body", () => {
    const stale = signedRequest({ method: "GET", path: "/api/discord/events", body: {}, nonce: "abcdef0123456789abcdef0123456789", timestamp: String(Date.now() - 600_000) });
    expect(verifyBotSyncRequest(stale)).toBe(false);
    const changed = signedRequest({ method: "POST", path: "/api/discord/applications", body: { playerName: "A" }, nonce: "fedcba9876543210fedcba9876543210" });
    changed.body = { playerName: "B" };
    expect(verifyBotSyncRequest(changed)).toBe(false);
  });
});

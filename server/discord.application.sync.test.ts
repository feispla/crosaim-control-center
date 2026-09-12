import { describe, expect, it } from "vitest";

const baseUrl = process.env.CROSAIM_E2E_BASE_URL;

describe.runIf(Boolean(baseUrl && process.env.CROSAIM_BOT_SYNC_SECRET))("Discord application sync endpoint", () => {
  it("rejects malformed bot payloads without creating a record", async () => {
    const secret = process.env.CROSAIM_BOT_SYNC_SECRET;
    expect(secret).toBeTruthy();
    const response = await fetch(`${baseUrl}/api/discord/applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-crosaim-sync-secret": secret ?? "" },
      body: JSON.stringify({ discordMessageId: "test-only" }),
    });
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: "invalid-application-data" });
  }, 15_000);
});

import { describe, expect, it } from "vitest";

describe("Discord web sync secret", () => {
  it("authenticates the lightweight event polling endpoint", async () => {
    const secret = process.env.CROSAIM_BOT_SYNC_SECRET;
    expect(secret).toBeTruthy();
    const response = await fetch("http://localhost:3000/api/discord/events", {
      headers: { "x-crosaim-sync-secret": secret ?? "" },
    });
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(Array.isArray(payload)).toBe(true);
  }, 15_000);
});

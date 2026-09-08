import { describe, expect, it } from "vitest";

describe("Discord webhook configuration", () => {
  it("can reach the configured webhook without sending a message", async () => {
    const webhookUrl = process.env.DISCORD_CROSAIM_WEBHOOK_URL;
    expect(webhookUrl).toMatch(/^https:\/\/discord\.com\/api\/webhooks\//);

    const response = await fetch(webhookUrl!, { method: "GET" });
    expect(response.ok).toBe(true);
    const payload = (await response.json()) as { id?: string; type?: number };
    expect(payload.id).toBeTruthy();
    expect(payload.type).toBe(1);
  }, 15000);
});

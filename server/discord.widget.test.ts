import { describe, expect, it } from "vitest";

const guildId = process.env.DISCORD_GUILD_ID;

describe.runIf(Boolean(guildId && process.env.CROSAIM_LIVE_DISCORD_TESTS === "true"))("public CROSAIM Discord widget", () => {
  it("exposes the configured guild and presence data", async () => {
    const response = await fetch(`https://discord.com/api/guilds/${guildId}/widget.json`);
    expect(response.ok).toBe(true);
    const data = await response.json() as { id: string; name: string; presence_count: number; channels: unknown[] };
    expect(data.id).toBe(guildId);
    expect(data.name).toBeTruthy();
    expect(data.presence_count).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(data.channels)).toBe(true);
  }, 15000);
});

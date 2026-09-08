import { describe, expect, it } from "vitest";

describe("public CROSAIM Discord widget", () => {
  it("exposes the configured guild and presence data", async () => {
    const response = await fetch("https://discord.com/api/guilds/1546641331927908472/widget.json");
    expect(response.ok).toBe(true);
    const data = await response.json() as { id: string; name: string; presence_count: number; channels: unknown[] };
    expect(data.id).toBe("1546641331927908472");
    expect(data.name).toBeTruthy();
    expect(data.presence_count).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(data.channels)).toBe(true);
  }, 15000);
});

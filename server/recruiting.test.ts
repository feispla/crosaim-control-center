import { describe, expect, it } from "vitest";
import { formatRecruitingWebhook } from "./routers";

describe("recruiting webhook identity", () => {
  it("includes the player name, Discord identity, role, rank, and contact", () => {
    const message = formatRecruitingWebhook({
      playerName: "RazeOne",
      discordUsername: "razeone.gg",
      discordUserId: "123456789012345678",
      role: "Duelista",
      rank: "Ascendant",
      contact: "raze@example.com",
      message: "Disponible para entrenar por las noches.",
    });

    expect(message).toContain("Jugador:** RazeOne");
    expect(message).toContain("<@123456789012345678>");
    expect(message).toContain("Duelista");
    expect(message).toContain("Ascendant");
    expect(message).toContain("raze@example.com");
  });
});

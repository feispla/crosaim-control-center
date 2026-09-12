import { afterEach, describe, expect, it } from "vitest";
import { getStatsProviderStatus, trackerSupportedTitles, valorantProviderMessage } from "./statsProviders";

describe("CROSAIM stats providers", () => {
  const oldTracker = process.env.TRACKER_API_KEY;
  const oldLegacyTracker = process.env.TRN_API_KEY;
  const oldRiot = process.env.RIOT_API_KEY;

  afterEach(() => {
    process.env.TRACKER_API_KEY = oldTracker;
    process.env.TRN_API_KEY = oldLegacyTracker;
    process.env.RIOT_API_KEY = oldRiot;
  });

  it("reports Tracker Network as configured without claiming Valorant support", () => {
    process.env.TRACKER_API_KEY = "server-only-test-key";
    delete process.env.TRN_API_KEY;
    delete process.env.RIOT_API_KEY;
    const status = getStatsProviderStatus();
    expect(status.trackerNetwork.configured).toBe(true);
    expect(status.trackerNetwork.valorantAvailable).toBe(false);
    expect(status.trackerNetwork.supportedTitles).toEqual(trackerSupportedTitles);
    expect(status.riotValorant.configured).toBe(false);
  });

  it("keeps the legacy Tracker key compatible", () => {
    delete process.env.TRACKER_API_KEY;
    process.env.TRN_API_KEY = "legacy-server-only-test-key";
    expect(getStatsProviderStatus().trackerNetwork.configured).toBe(true);
  });

  it("reports Riot as the Valorant provider when configured", () => {
    delete process.env.TRACKER_API_KEY;
    delete process.env.TRN_API_KEY;
    process.env.RIOT_API_KEY = "server-only-test-key";
    expect(getStatsProviderStatus().riotValorant.status).toBe("available");
    expect(valorantProviderMessage()).toContain("Riot");
  });
});

import { z } from "zod";

export const trackerSupportedTitles = ["apex", "division-2", "csgo", "splitgate"] as const;
export type TrackerSupportedTitle = (typeof trackerSupportedTitles)[number];

export const statsProviderStatus = z.object({
  trackerNetwork: z.object({ configured: z.boolean(), valorantAvailable: z.literal(false), supportedTitles: z.array(z.string()) }),
  riotValorant: z.object({ configured: z.boolean(), status: z.enum(["available", "not_configured"]) }),
});

export function getStatsProviderStatus() {
  const trackerConfigured = Boolean(process.env.TRN_API_KEY);
  const riotConfigured = Boolean(process.env.RIOT_API_KEY);
  return {
    trackerNetwork: { configured: trackerConfigured, valorantAvailable: false as const, supportedTitles: [...trackerSupportedTitles] },
    riotValorant: { configured: riotConfigured, status: riotConfigured ? "available" as const : "not_configured" as const },
  };
}

export async function trackerRequest<T>(path: string): Promise<T> {
  const apiKey = process.env.TRN_API_KEY;
  if (!apiKey) throw new Error("TRN_API_KEY is not configured");
  const response = await fetch(`https://public-api.tracker.gg${path}`, { headers: { "TRN-Api-Key": apiKey, Accept: "application/json" } });
  if (!response.ok) throw new Error(`Tracker Network returned HTTP ${response.status}`);
  return response.json() as Promise<T>;
}

export function valorantProviderMessage() {
  return "Tracker Network no ofrece actualmente una API oficial de VALORANT. CROSAIM usa el adaptador Riot oficial para VALORANT y reserva Tracker Network para sus títulos API soportados.";
}

import { z } from "zod";

export const trackerSupportedTitles = ["apex", "division-2", "csgo", "splitgate"] as const;
export type TrackerSupportedTitle = (typeof trackerSupportedTitles)[number];
export const trackerPlatform = z.string().trim().min(2).max(20);

export type TrackerProfileResult = {
  title: string;
  platform: string;
  player: string;
  profile: unknown;
  sessions: unknown | null;
};

export function getStatsProviderStatus() {
  const trackerConfigured = Boolean(process.env.TRACKER_API_KEY || process.env.TRN_API_KEY);
  const riotConfigured = Boolean(process.env.RIOT_API_KEY);
  return {
    trackerNetwork: { configured: trackerConfigured, valorantAvailable: false as const, supportedTitles: [...trackerSupportedTitles] },
    riotValorant: { configured: riotConfigured, status: riotConfigured ? "available" as const : "not_configured" as const },
  };
}

function trackerError(status: number) {
  if (status === 401 || status === 403) return "Tracker Network no está autorizado. Revisa TRACKER_API_KEY.";
  if (status === 404) return "Jugador no encontrado en Tracker Network.";
  if (status === 429) return "Tracker Network está limitando las solicitudes. Intenta más tarde.";
  if (status >= 500) return "Tracker Network no está disponible temporalmente.";
  return "Tracker Network devolvió una respuesta no válida.";
}

export async function trackerRequest<T>(path: string): Promise<T> {
  const apiKey = process.env.TRACKER_API_KEY || process.env.TRN_API_KEY;
  if (!apiKey) throw new Error("Tracker Network no está configurado en el servidor.");
  const response = await fetch(`https://public-api.tracker.gg${path}`, { headers: { "TRN-Api-Key": apiKey, Accept: "application/json" } });
  if (!response.ok) throw new Error(trackerError(response.status));
  return response.json() as Promise<T>;
}

export async function getTrackerProfile(input: { title: TrackerSupportedTitle; platform: string; player: string }): Promise<TrackerProfileResult> {
  const platform = trackerPlatform.parse(input.platform);
  const player = input.player.trim();
  if (player.length < 2 || player.length > 120) throw new Error("Introduce un nombre de jugador válido.");
  const encodedPlayer = encodeURIComponent(player);
  const base = `/v2/${input.title}/standard/profile/${platform}/${encodedPlayer}`;
  const profile = await trackerRequest<unknown>(base);
  let sessions: unknown | null = null;
  if (input.title === "apex") {
    try { sessions = await trackerRequest<unknown>(`${base}/sessions`); } catch { sessions = null; }
  }
  return { title: input.title, platform, player, profile, sessions };
}

export function valorantProviderMessage() {
  return "Tracker Network no documenta actualmente una API pública de VALORANT. El módulo queda preparado para los títulos soportados por Tracker Network y mantiene VALORANT separado para el adaptador oficial de Riot.";
}

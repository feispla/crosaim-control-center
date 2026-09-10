export function formatClipDiscordMessage(input: { name: string; url: string; size: number; contentType: string }) {
  const sizeMb = (input.size / (1024 * 1024)).toFixed(1);
  return `**NUEVO CLIP CROSAIM**\n**Archivo:** ${input.name}\n**Tamaño:** ${sizeMb} MB · ${input.contentType}\n**Abrir clip:** ${input.url}`;
}

export async function sendClipDiscordNotice(input: { name: string; url: string; size: number; contentType: string }) {
  const webhookUrl = process.env.DISCORD_CLIPS_WEBHOOK_URL || process.env.DISCORD_CROSAIM_WEBHOOK_URL;
  if (!webhookUrl) return false;
  const response = await fetch(webhookUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: formatClipDiscordMessage(input), allowed_mentions: { parse: [] } }) });
  return response.ok;
}

import webpush from "web-push";
import { deletePushSubscription, listPushSubscriptions } from "./db";

export type PushPayload = {
  title: string;
  body: string;
  tag?: string;
  url?: string;
  requireInteraction?: boolean;
};

function getVapidConfig() {
  const subject = process.env.VAPID_SUBJECT;
  const publicKey = process.env.VITE_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!subject || !publicKey || !privateKey) return null;
  return { subject, publicKey, privateKey };
}

export function isPushConfigured() {
  return Boolean(getVapidConfig());
}

export function getPublicVapidKey() {
  return getVapidConfig()?.publicKey ?? null;
}

export async function sendPushToUser(userId: number, payload: PushPayload) {
  const config = getVapidConfig();
  if (!config) return { sent: 0, removed: 0, configured: false };
  webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey);
  const subscriptions = await listPushSubscriptions(userId);
  let sent = 0;
  let removed = 0;
  for (const row of subscriptions) {
    try {
      await webpush.sendNotification({ endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } }, JSON.stringify(payload));
      sent += 1;
    } catch (error) {
      const statusCode = typeof error === "object" && error !== null && "statusCode" in error ? Number(error.statusCode) : 0;
      if (statusCode === 404 || statusCode === 410) {
        await deletePushSubscription(row.endpoint);
        removed += 1;
      } else {
        console.error("[Push] Delivery failed", { endpoint: row.endpoint.slice(0, 48), statusCode });
      }
    }
  }
  return { sent, removed, configured: true };
}

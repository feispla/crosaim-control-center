import { describe, expect, it } from "vitest";
import webpush from "web-push";

const configured = Boolean(process.env.VAPID_SUBJECT && process.env.VITE_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);

describe.runIf(configured)("VAPID configuration", () => {
  it("accepts the configured VAPID credentials", () => {
    const subject = process.env.VAPID_SUBJECT;
    const publicKey = process.env.VITE_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;

    expect(subject).toMatch(/^https?:\/\//);
    expect(publicKey).toMatch(/^[A-Za-z0-9_-]{80,}$/);
    expect(privateKey).toMatch(/^[A-Za-z0-9_-]{40,}$/);
    expect(() => webpush.setVapidDetails(subject!, publicKey!, privateKey!)).not.toThrow();
  });
});

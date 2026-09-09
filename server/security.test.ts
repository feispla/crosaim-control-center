import { describe, expect, it, beforeEach } from "vitest";
import { allowedClipTypes, consumeRateLimit, isSameSiteRequest, resetRateLimitStateForTests, safeClipName } from "./security";

function request(headers: Record<string, string>) {
  return {
    header(name: string) { return headers[name.toLowerCase()]; },
    ip: "127.0.0.1",
    socket: { remoteAddress: "127.0.0.1" },
  } as never;
}

describe("website security helpers", () => {
  beforeEach(() => resetRateLimitStateForTests());

  it("allows same-site requests and rejects cross-site origins", () => {
    expect(isSameSiteRequest(request({ origin: "https://crosaimdash-h9bxzuxs.manus.space", host: "crosaimdash-h9bxzuxs.manus.space" }))).toBe(true);
    expect(isSameSiteRequest(request({ origin: "https://evil.example", host: "crosaimdash-h9bxzuxs.manus.space" }))).toBe(false);
  });

  it("enforces a bounded request window", () => {
    expect(consumeRateLimit("test", 2, 60_000)).toBe(true);
    expect(consumeRateLimit("test", 2, 60_000)).toBe(true);
    expect(consumeRateLimit("test", 2, 60_000)).toBe(false);
  });

  it("normalizes filenames and only accepts supported video types", () => {
    expect(safeClipName("../../private/clip final.mp4")).toBe("clip-final.mp4");
    expect(allowedClipTypes.has("video/mp4")).toBe(true);
    expect(allowedClipTypes.has("application/javascript")).toBe(false);
  });
});

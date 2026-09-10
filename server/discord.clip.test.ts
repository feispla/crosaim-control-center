import { describe, expect, it } from "vitest";
import { formatClipDiscordMessage } from "./discord";

describe("Discord clip notification", () => {
  it("includes the clip identity, size, format, and public link", () => {
    const message = formatClipDiscordMessage({ name: "retake-b.mp4", url: "https://crosaimdash-h9bxzuxs.manus.space/manus-storage/crosaim/clips/retake-b.mp4", size: 2 * 1024 * 1024, contentType: "video/mp4" });
    expect(message).toContain("NUEVO CLIP CROSAIM");
    expect(message).toContain("retake-b.mp4");
    expect(message).toContain("2.0 MB");
    expect(message).toContain("https://crosaimdash-h9bxzuxs.manus.space");
  });
});

import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function contextWithRole(role: "user" | "admin"): TrpcContext {
  const now = new Date();
  return {
    user: { id: 77, openId: "panel-user", name: "Panel User", email: "panel@example.com", loginMethod: "manus", role, createdAt: now, updatedAt: now, lastSignedIn: now },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("admin Push panel", () => {
  it("rejects a regular authenticated user", async () => {
    const caller = appRouter.createCaller(contextWithRole("user"));
    await expect(caller.adminPush.subscribers()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects an unauthenticated caller", async () => {
    const caller = appRouter.createCaller({ user: undefined, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] });
    await expect(caller.adminPush.subscribers()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

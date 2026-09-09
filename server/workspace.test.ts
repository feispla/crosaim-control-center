import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function unauthenticatedContext(): TrpcContext {
  return {
    user: undefined,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("persistent workspace procedures", () => {
  it("requires an authenticated user to read roster data", async () => {
    const caller = appRouter.createCaller(unauthenticatedContext());
    await expect(caller.roster.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("requires an authenticated user to read calendar data", async () => {
    const caller = appRouter.createCaller(unauthenticatedContext());
    await expect(caller.calendar.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});

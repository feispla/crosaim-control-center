import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { hasCapability, type CrosaimCapability } from '@shared/rbac';
import { initTRPC, TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { createAuditRecord, getEffectiveRoleKeys } from "../db";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

function requireCapability(capability: CrosaimCapability, unauthenticatedAsForbidden = false) {
  return t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user) {
      throw new TRPCError({ code: unauthenticatedAsForbidden ? "FORBIDDEN" : "UNAUTHORIZED", message: unauthenticatedAsForbidden ? NOT_ADMIN_ERR_MSG : UNAUTHED_ERR_MSG });
    }
    const roles = await getEffectiveRoleKeys(ctx.user);
    const allowed = hasCapability(roles, capability);
    try {
      await createAuditRecord({
        eventId: nanoid(24),
        actorUserId: ctx.user.id,
        actorType: "user",
        action: `authorization.${capability}`,
        entityType: "procedure",
        entityId: opts.path,
        afterState: JSON.stringify({ roles, allowed }),
        source: "trpc",
        outcome: allowed ? "allowed" : "denied",
      });
    } catch (error) {
      console.error("[Audit] Could not record authorization decision", error);
    }
    if (!allowed) {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  });
}

export const capabilityProcedure = (capability: CrosaimCapability) => protectedProcedure.use(requireCapability(capability));
export const adminProcedure = t.procedure.use(requireCapability("settings.manage", true));

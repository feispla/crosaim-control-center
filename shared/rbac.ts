export const CROSAIM_ROLE_KEYS = [
  "SUPER_ADMIN",
  "ADMIN",
  "MANAGER",
  "COACH",
  "SCOUT",
  "CONTENT",
  "PLAYER",
  "TRYOUT",
  "VIEWER",
] as const;

export type CrosaimRoleKey = (typeof CROSAIM_ROLE_KEYS)[number];

export const CROSAIM_CAPABILITIES = [
  "dashboard.view",
  "players.manage",
  "applications.review",
  "roster.manage",
  "tournaments.manage",
  "content.publish",
  "settings.manage",
  "discord.reconcile",
  "roles.manage",
] as const;

export type CrosaimCapability = (typeof CROSAIM_CAPABILITIES)[number];

export const ROLE_CAPABILITIES: Readonly<Record<CrosaimRoleKey, readonly CrosaimCapability[]>> = {
  SUPER_ADMIN: CROSAIM_CAPABILITIES,
  ADMIN: CROSAIM_CAPABILITIES,
  MANAGER: ["dashboard.view", "players.manage", "applications.review", "roster.manage", "tournaments.manage"],
  COACH: ["dashboard.view", "players.manage", "applications.review", "roster.manage"],
  SCOUT: ["dashboard.view", "players.manage", "applications.review"],
  CONTENT: ["dashboard.view", "content.publish"],
  PLAYER: ["dashboard.view"],
  TRYOUT: ["dashboard.view"],
  VIEWER: ["dashboard.view"],
};

export const LEGACY_ROLE_MAP = {
  admin: "SUPER_ADMIN",
  user: "VIEWER",
} as const satisfies Record<"admin" | "user", CrosaimRoleKey>;

export function isCrosaimRoleKey(value: string): value is CrosaimRoleKey {
  return (CROSAIM_ROLE_KEYS as readonly string[]).includes(value);
}

export function legacyRoleKey(role: "admin" | "user"): CrosaimRoleKey {
  return LEGACY_ROLE_MAP[role];
}

export function hasCapability(roles: readonly CrosaimRoleKey[], capability: CrosaimCapability): boolean {
  return roles.some(role => ROLE_CAPABILITIES[role].includes(capability));
}

export function permissionsForRole(role: CrosaimRoleKey): readonly CrosaimCapability[] {
  return ROLE_CAPABILITIES[role];
}

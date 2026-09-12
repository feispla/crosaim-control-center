# CROSAIM Production Cutover

## Current implementation state

This release makes the current **Control Center MySQL/Drizzle application store** safer by adding granular role capabilities, append-only audit records, a leased Discord outbox, signed service requests, and a journaled migration. The Discord bot gains a matching signed client and a non-destructive Discord topology reconciler.

> **Supabase is not yet the Control Center runtime store.** The bot currently maintains Supabase recruitment records while the Control Center maintains MySQL/Drizzle records. They must not be treated as peer authorities in production. A Supabase cutover requires the active project credentials, a data backup, a migration plan, and a staging canary. This release prevents an unsafe undocumented cutover while establishing the contracts needed for one.

## Prerequisites

The release owner must provide a staging MySQL database, the current production database backup, a staging Discord guild, the Discord bot application's OAuth2 configuration, the persistent bot-host volume, and service-only secrets. Do not place any secret in GitHub, browser code, or this repository.

| Variable | Control Center | Bot | Requirement |
| --- | --- | --- | --- |
| `CROSAIM_BOT_SYNC_SECRET` | Yes | Yes | Same high-entropy value. |
| `CROSAIM_SIGNED_SYNC_REQUIRED` | Yes | No | Begin with `false` during one coordinated deploy, then set `true`. |
| `CROSAIM_WEB_BASE_URL` | No | Yes | Public HTTPS Control Center base URL. |
| `DATABASE_URL` | Yes | No | MySQL database reachable by the Control Center. |
| `SUPABASE_URL` / service role key | No | Yes | Server-only bot configuration pending source-of-truth consolidation. |
| `CROSAIM_RUNTIME_CONFIG_PATH` | No | Yes | File on a persistent mounted volume. |
| `POSTULACION_WEBHOOK_ID` | No | Yes | Exact authorized Discord webhook. |

## Ordered deployment

1. Back up the Control Center MySQL database and inventory whether an unjournaled historical `0007` or `0008` was ever applied. **Do not apply the new migration to a database that already has those unjournaled schema changes without a baseline review.**
2. Deploy the Control Center migration to an empty staging clone from journaled migration `0006` using `pnpm db:migrate`. Verify all existing applications are preserved and the new tables `auditRecords`, `userRoleAssignments`, and `discordAccounts` exist.
3. Deploy the Control Center application with `CROSAIM_SIGNED_SYNC_REQUIRED=false` only for the brief coordinated rollout window.
4. Deploy the bot with the matching shared secret and persistent `/app/data` mount. Confirm its signed requests include both the legacy header and v1 signature headers.
5. Set `CROSAIM_SIGNED_SYNC_REQUIRED=true` on the Control Center and restart it. A static secret alone must now fail.
6. In the staging Discord guild run `/crosaim plan`, resolve all blockers, run `/crosaim status`, and finally run `/crosaim setup`. The bot must not have `Administrator` and must be above only CROSAIM managed roles.
7. Run one canary: authorized application webhook, review, interview, tryout, roster. Verify one state change, one audit record, one leased outbox delivery, one lease-bound acknowledgement, and one Discord role mutation at every transition.
8. Only after successful canary, repeat the cutover on production under a maintenance window. Monitor events in `retry` and `dead_letter`; do not manually delete them.

## Supabase consolidation decision

The conversation requires Supabase as the future single source of truth. Before that migration, choose and document exactly one of these paths:

| Path | Work required | Release safety |
| --- | --- | --- |
| **Move Control Center to Supabase** | Replace MySQL/Drizzle database access with server-only Supabase access, port the application/outbox/audit schema, enforce RLS, backfill MySQL records, and switch all readers/writers atomically. | Preferred for the stated architecture, but requires a dedicated migration release and real project access. |
| **Keep MySQL temporarily** | Refactor the bot to use signed Control Center APIs for all application state and audit actions, then retire direct Supabase recruitment writes. | Safe interim route, but does not satisfy the target Supabase architecture. |

Do not implement asynchronous bidirectional replication as a substitute for this decision. It would recreate the divergent-state failure the cutover is designed to eliminate.

## Verification commands

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
DATABASE_URL='mysql://…' pnpm db:migrate
```

The credentialed end-to-end test must run only in a controlled staging environment after the required variables are present.

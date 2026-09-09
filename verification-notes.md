Final visual verification on 2026-09-08:

The desktop dashboard preview remains readable after the recruiting and notification changes. The main shell preserves the dark esports theme, high-contrast white/red hero typography, colored metric icons, and visible navigation. TypeScript has no errors, the dev server is running, and the production build succeeded.

The roster workflow now uses distinct colored status badges and identity fields. The application flow stores player name, Discord username/ID, contact, role, rank, and message; the Discord notification includes the player identity so the team can recruit the correct person.
Browser verification on 2026-09-08:

The preview loads successfully. The main panel shows the live Discord server name `CA CROSAIM`, `15 presentes`, `DATOS ACTUALIZADOS`, the invite action `UNIRSE A CA CROSAIM`, the custom notice composer action, and `ACTIVAR ALERTAS`. Navigation exposes `Plantilla & tryouts` for the new identity and application workflow.
The roster preview verifies the new colored states: green ACTIVO, purple TRYOUT, orange pending-style status, plus distinct blue/purple/orange source badges. The `NUEVA POSTULACIÓN` form visibly requires player name, Discord username, and player message, while supporting Discord ID and alternate contact; it also shows colored role/rank controls and the `ENVIAR POSTULACIÓN` action.
Database synchronization milestone verification on 2026-09-08:

The dashboard preview still renders with the existing high-contrast CROSAIM visual system after adding persistent workspace queries and mutations. The dev server is running, the production build succeeded, TypeScript passed, the database migration was applied successfully, and the full test suite now reports 5 test files and 6 passing tests.

SecurityBot.gg verification: Security Bot protects the Discord server with anti-nuke, anti-raid, anti-spam, CAPTCHA verification, moderation, and whitelist features. It does not protect CROSAIM's website endpoints, upload route, database, or public forms; those still require application-level controls in the next milestone.

Security and VAPID Push milestone verification on 2026-09-09:

The website now protects public recruiting submissions with same-site origin validation, an invisible honeypot field, per-IP rate limiting, strict Zod input limits, and Discord-safe message formatting. Clip uploads require an authenticated session, same-site origin, a supported video MIME type, a 120 MB maximum size, a five-upload rate window, and path-safe filenames. Discord notices also require authentication, same-site origin, and a rate limit.

Real Web Push is configured with VAPID. The public key is exposed to the browser through VITE_VAPID_PUBLIC_KEY; private signing credentials remain server-only. Browser subscriptions are stored in the database, backend notifications call web-push, urgent recruitment alerts use persistent notifications, and expired 404/410 subscriptions are removed automatically. The service worker displays server-sent payloads and honors requireInteraction for urgent notices.

Validation: VAPID configuration test passed; security helper tests passed; full suite passed with 7 files and 10 tests; TypeScript check passed; production build passed; dashboard preview rendered successfully.

Operational boundary: rate-limit counters are process-local. For a multi-instance deployment with high public traffic, replace the in-memory limiter with a shared store or edge rate limiter.

Admin Push panel milestone verification on 2026-09-09:

Added an admin-only Centro de alertas section. It lists sanitized subscriber metadata (account name, email, subscription time, and device count) without exposing Push endpoints or cryptographic keys. The composer supports broadcast alerts or a selected subscriber, custom title/message, and info, success, warning, or urgent priority. Sending creates synchronized in-app notifications and dispatches Web Push through the existing VAPID backend; urgent notices use persistent browser notifications.

Authorization tests verify both unauthenticated callers and regular authenticated users receive FORBIDDEN for the admin subscriber endpoint. TypeScript passed, the full suite passed with 8 test files and 12 tests, the production build passed, and the dashboard preview shows the new admin navigation entry.

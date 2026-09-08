Final visual verification on 2026-09-08:

The desktop dashboard preview remains readable after the recruiting and notification changes. The main shell preserves the dark esports theme, high-contrast white/red hero typography, colored metric icons, and visible navigation. TypeScript has no errors, the dev server is running, and the production build succeeded.

The roster workflow now uses distinct colored status badges and identity fields. The application flow stores player name, Discord username/ID, contact, role, rank, and message; the Discord notification includes the player identity so the team can recruit the correct person.
Browser verification on 2026-09-08:

The preview loads successfully. The main panel shows the live Discord server name `CA CROSAIM`, `15 presentes`, `DATOS ACTUALIZADOS`, the invite action `UNIRSE A CA CROSAIM`, the custom notice composer action, and `ACTIVAR ALERTAS`. Navigation exposes `Plantilla & tryouts` for the new identity and application workflow.
The roster preview verifies the new colored states: green ACTIVO, purple TRYOUT, orange pending-style status, plus distinct blue/purple/orange source badges. The `NUEVA POSTULACIÓN` form visibly requires player name, Discord username, and player message, while supporting Discord ID and alternate contact; it also shows colored role/rank controls and the `ENVIAR POSTULACIÓN` action.

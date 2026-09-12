# CROSAIM Tracker: configuración operativa

## Variables de entorno del servidor

Configura estas variables exclusivamente en el entorno server-side de Manus/Vercel. No deben comenzar con `VITE_` y no deben aparecer en el frontend, HTML, respuestas JSON ni GitHub:

```text
TRACKER_API_KEY=clave_de_la_app_de_Tracker_Network
DISCORD_TRACKER_CLIENT_ID=application_id_de_Crosaim_Tracker
DISCORD_TRACKER_CLIENT_SECRET=client_secret_de_Crosaim_Tracker
DISCORD_TRACKER_BOT_TOKEN=token_del_bot_Crosaim_Tracker
RIOT_API_KEY=opcional_para_un_futuro_adaptador_oficial_de_VALORANT
```

El código existente del bot principal mantiene sus propias variables Discord. No se sustituyen ni se reutilizan para `Crosaim Tracker`.

## Discord Developer Portal

Para instalar el bot independiente en el servidor, genera una URL OAuth2 de instalación usando el `DISCORD_TRACKER_CLIENT_ID`, los scopes `bot` y `applications.commands`, y únicamente los permisos que el bot necesite. La URL de instalación tiene esta forma:

```text
https://discord.com/oauth2/authorize?client_id=DISCORD_TRACKER_CLIENT_ID&scope=bot%20applications.commands&permissions=0
```

Reemplaza el valor de ejemplo por el ID real y usa los permisos que correspondan al bot. La instalación de un bot no necesita callback URL.

El callback OAuth2 existente de vinculación de usuarios del bot principal es:

```text
https://crosaimdash-h9bxzuxs.manus.space/api/discord/oauth/callback
```

Ese callback pertenece a `DISCORD_CLIENT_ID` y `DISCORD_CLIENT_SECRET` del bot principal. **No lo sustituyas por las credenciales de Crosaim Tracker.** En esta implementación, el bot Tracker se comunica server-to-server con:

```text
GET https://crosaimdash-h9bxzuxs.manus.space/api/tracker/profile?title=apex&platform=origin&player=PLAYER_NAME
Header: x-crosaim-tracker-bot-token: DISCORD_TRACKER_BOT_TOKEN
```

El endpoint nunca devuelve la clave de Tracker Network y solo acepta el token desde el servidor del bot.

## Alcance de Tracker Network

La documentación pública actual de Tracker Network describe endpoints para Apex Legends, The Division 2, CSGO y Splitgate. El módulo presenta correctamente jugador no encontrado, autorización, límites, respuestas vacías y caída temporal del proveedor. No hace scraping.

Tracker Network no documenta actualmente una API pública de VALORANT. Por tanto, el módulo no afirma tener estadísticas de VALORANT ni intenta obtenerlas de endpoints no autorizados. `RIOT_API_KEY` queda separado para un adaptador oficial de Riot cuando la credencial y el alcance de uso estén aprobados.

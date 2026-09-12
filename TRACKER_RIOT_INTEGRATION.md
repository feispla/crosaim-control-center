# Integración de estadísticas CROSAIM

## Decisión técnica

CROSAIM no hará scraping de tracker.gg. La integración se mantiene en el backend y utiliza la cabecera `TRN-Api-Key` cuando se consulta un título que Tracker Network documenta como soportado. La documentación pública consultada actualmente enumera Apex Legends, The Division 2, CSGO y Splitgate; no enumera VALORANT.

Por esa razón, el backend expone `stats.providers`, informa si existe `TRN_API_KEY`, declara explícitamente que Tracker Network no está habilitado como proveedor de VALORANT y deja `RIOT_API_KEY` como la credencial server-side para el futuro adaptador oficial de Riot. Ninguna de estas claves se expone al navegador ni se registra en Git.

## Flujo operativo

El Control Center será la fuente de configuración. Discord consumirá eventos del backend para publicar actualizaciones en los canales de CROSAIM. Las consultas de estadísticas deben ejecutarse desde el servidor, aplicar límites de tasa y guardar únicamente los datos necesarios para perfiles, partidas, ranking, agentes y mapas.

## Configuración pendiente

El administrador debe registrar una aplicación en Tracker Network si necesita títulos compatibles y guardar su clave como `TRN_API_KEY` en el entorno del servidor. Para estadísticas de VALORANT debe solicitar y configurar una clave aprobada de Riot como `RIOT_API_KEY`; no se debe sustituir por una API no oficial ni por scraping.

## Fuentes

- [Tracker Network APIs for Developers](https://tracker.gg/developers)
- [Tracker Network authentication](https://tracker.gg/developers/docs/authentication)
- [Tracker Network developer repository](https://github.com/TrackerNetwork/TRN.Developers)
- [Riot Games VALORANT Developer Portal](https://developer.riotgames.com/docs/valorant)

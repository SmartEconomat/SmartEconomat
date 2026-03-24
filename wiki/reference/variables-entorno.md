# Reference: Variables de entorno

Fuente principal: `.env.example` y consumo en `src/main.ts`, `src/config/database.config.ts`, `src/instrument.ts`, guards y servicios de auth.

| Variable | Descripción | Default/fallback | Required |
|---|---|---|---|
| `NODE_ENV` | Entorno de ejecución (`development`, `test`, `production`) | `development` | Sí |
| `DOMAIN` | Dominio base de despliegue | `localhost` | No |
| `BACKEND_PORT` | Puerto de escucha del backend | `3000` | Sí |
| `BACKEND_API_URL` | URL pública backend | `http://localhost:3000` | Sí |
| `FRONTEND_PORT` | Puerto local frontend | `5173` | No |
| `FRONTEND_API_URL` | Origen CORS y redirecciones de auth | `http://localhost:5173` | Sí |
| `POSTGRES_USER` | Usuario PostgreSQL (fallback) | `postgres` | No |
| `POSTGRES_PASSWORD` | Password PostgreSQL (fallback) | `postgres` | No |
| `POSTGRES_DB` | DB PostgreSQL (fallback) | `app_db` | No |
| `DB_HOST` | Host de base de datos | `localhost` o `db` en Docker | Sí |
| `DB_PORT` | Puerto de base de datos | `5432` | Sí |
| `DB_USERNAME` | Usuario principal para TypeORM | `postgres` | Sí |
| `DB_PASSWORD` | Password principal para TypeORM | `postgres` | Sí |
| `DB_DATABASE` | Nombre de base de datos | `app_db` | Sí |
| `DB_SYNC` | Habilita sincronización automática de esquema | `false` implícito (depende de `NODE_ENV`) | No |
| `JWT_SECRET` | Secreto de firma de JWT | `changeme` en ejemplo | Sí |
| `JWT_EXPIRATION` | Expiración de token JWT | `7d` | Sí |
| `SENTRY_DSN` | DSN de Sentry backend | vacío | No |
| `VITE_SENTRY_DSN` | DSN de Sentry frontend | vacío | No |
| `VITE_API_PROXY_TARGET` | Proxy API en Vite | `http://localhost:3000` | No |
| `SEEDER_LANG` | Idioma por defecto para seeders i18n | valor interno por helper | No |

## Recomendaciones
- En producción, no usar defaults del `.env.example`.
- Gestionar secretos con vault o gestor seguro.
- Rotar `JWT_SECRET` y credenciales DB periódicamente.

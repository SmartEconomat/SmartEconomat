# Variables de entorno

Este documento resume las variables soportadas por el proyecto y diferencia claramente entre las que pertenecen a la aplicación y las que usa el flujo de despliegue.

## Fuentes de verdad

- Desarrollo local: [.env.example](../../.env.example)
- Backend: `src/main.ts`, `src/config/database.config.ts`, `src/modules/auth/mail.service.ts`, `src/instrument.ts`
- Despliegue: [scripts/deploy.sh](../../scripts/deploy.sh), [docker-compose.prod.yml](../../docker-compose.prod.yml)

## Variables generales

| Variable | Uso | Valor por defecto o ejemplo |
| --- | --- | --- |
| `NODE_ENV` | Entorno de ejecución (`development`, `test`, `production`) | `development` |
| `DOMAIN` | Dominio base del despliegue | `localhost` |

## Backend y API

| Variable | Uso | Valor por defecto o ejemplo |
| --- | --- | --- |
| `BACKEND_PORT` | Puerto de escucha del backend | `3000` |
| `BACKEND_API_URL` | URL pública o interna del backend | `http://localhost:3000` |
| `JWT_SECRET` | Secreto de firma JWT | `changeme` en el ejemplo |
| `JWT_EXPIRATION` | Vida útil del token | `7d` |
| `SENTRY_DSN` | DSN de Sentry para backend | vacío |

## Base de datos

| Variable | Uso | Valor por defecto o ejemplo |
| --- | --- | --- |
| `POSTGRES_USER` | Usuario del contenedor PostgreSQL | `postgres` |
| `POSTGRES_PASSWORD` | Contraseña del contenedor PostgreSQL | `postgres` |
| `POSTGRES_DB` | Base de datos inicial del contenedor | `app_db` |
| `DB_HOST` | Host usado por TypeORM | `localhost` en local, `db` en Compose |
| `DB_PORT` | Puerto de PostgreSQL | `5432` |
| `DB_USERNAME` | Usuario efectivo para TypeORM | `postgres` |
| `DB_PASSWORD` | Contraseña efectiva para TypeORM | `postgres` |
| `DB_DATABASE` | Nombre de la base de datos usada por la app | `app_db` |
| `DB_SYNC` | Fuerza sincronización automática del esquema | no aparece en `.env.example`, pero el backend la soporta |

### Nota sobre `DB_SYNC`

Si `DB_SYNC=true`, el backend sincroniza el esquema automáticamente. En desarrollo puede ser útil; en producción no debe usarse como sustituto de migraciones o procedimientos controlados.

## Frontend

| Variable | Uso | Valor por defecto o ejemplo |
| --- | --- | --- |
| `FRONTEND_PORT` | Puerto local del frontend | `5173` |
| `FRONTEND_API_URL` | Origen del frontend y base para CORS y enlaces de recuperación | `http://localhost:5173` |
| `VITE_API_PROXY_TARGET` | Destino del proxy de Vite | `http://localhost:3000` |
| `VITE_SENTRY_DSN` | DSN de Sentry para frontend | vacío |

## Email y recuperación de contraseña

| Variable | Uso | Valor por defecto o ejemplo |
| --- | --- | --- |
| `MAIL_HOST` | Host SMTP | vacío |
| `MAIL_PORT` | Puerto SMTP | `587` |
| `MAIL_USER` | Usuario SMTP | vacío |
| `MAIL_PASS` | Contraseña SMTP | vacío |
| `MAIL_FROM` | Remitente de emails | `noreply@smarteconomat.com` |

Si `MAIL_HOST` o `MAIL_USER` no están configurados, el backend entra en modo simulación y registra los intentos de envío en logs.

## Variables de despliegue usadas por el script

Estas variables son relevantes cuando se usa [scripts/deploy.sh](../../scripts/deploy.sh):

| Variable | Uso |
| --- | --- |
| `ACME_DIRECTORY_URL` | Endpoint ACME para emisión o renovación de certificados |
| `ACME_EMAIL` | Email de registro para Certbot |
| `DOMAIN` | Dominio para certificados y enlaces públicos |
| `BACKEND_API_URL` | URL que se escribe en `.env.prod` |
| `FRONTEND_API_URL` | URL que se escribe en `.env.prod` |
| `VITE_API_PROXY_TARGET` | Destino del proxy frontend en producción |

## Recomendaciones

- No reutilizar los valores de ejemplo en producción.
- Gestionar secretos fuera del repositorio.
- Mantener alineados `FRONTEND_API_URL`, CORS y las URLs de recuperación de contraseña.
- Si cambias `DOMAIN` en producción, revisa también certificados, Nginx y variables del frontend.
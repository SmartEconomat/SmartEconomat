# Configuracion

## Configuracion central

Archivos de entorno en raiz:

- `.env.example` - plantilla base.
- `.env.dev` - desarrollo.
- `.env.prod` - produccion.

Docker Compose consume esos archivos mediante `env_file`.

## Puertos y endpoints

### Desarrollo

- Frontend: `FRONTEND_PORT` (default `5173`)
- Backend: `BACKEND_PORT` (default `3000`)
- PostgreSQL: `POSTGRES_PORT` (default `5432`)

### Produccion

- Frontend Nginx: `FRONTEND_HTTP_PORT` (default `80`)
- Frontend TLS: `FRONTEND_HTTPS_PORT` (default `443`)
- Backend interno: `3000` en red Docker.

## Configuracion de backend

Puntos relevantes:

- Prefijo global API: `/api/v1`.
- `ConfigModule` global para variables de entorno.
- DB y TypeORM configurados desde `src/config`.
- Seguridad HTTP en `main.ts` + middleware/interceptors/guards.

## Configuracion de frontend

- Vite en `vite.config.ts`.
- Proxy `/api` hacia backend en desarrollo.
- URLs y DSN de observabilidad por variables de entorno.

## Configuracion de ElectronInstaller

- Plantilla de entorno en `ElectronInstaller/resources/templates`.
- Validacion schema con `validate:env-template`.
- Artefactos y NSIS configurados en `ElectronInstaller/package.json`.

## Configuracion de certificados/TLS

- `TLS_PROVIDER` define modo TLS en produccion.
- Certificados montados en frontend (`CERTS_DIR`, `CERTS_WEBROOT_DIR`).

## Configuracion no encontrada (explicita)

- No hay gestion unificada de configuracion mediante schema global unico de backend con Joi/Zod en arranque.

## Dominios, URLs derivadas y proxy

Para despliegues con dominio propio o varios hosts (app pública, API, TLS), conviene alinear estas variables entre `.env.dev` / `.env.prod` y Docker Compose:

| Variable | Rol |
| --- | --- |
| `DOMAIN` | Dominio lógico del despliegue (documentación operativa). |
| `URL_BACKEND_DERIVADA` | URL pública o interna del API NestJS (p. ej. `https://api.ejemplo.com` o `http://localhost:3000`). |
| `URL_FRONTEND_DERIVADA` | URL del cliente web (p. ej. `https://app.ejemplo.com` o `http://localhost:5173`). |
| `VITE_PROXY_DERIVADO` | Destino del proxy de Vite en desarrollo: debe apuntar al mismo backend que consumirá el navegador. |

Buenas prácticas:

- Mantener valores de local y producción en ficheros `.env` distintos; no mezclar secretos.
- Tras cambiar dominio, puertos o proxy, recrear contenedores para aplicar la configuración.
- Inventario detallado de variables: [environment-variables.md](./environment-variables.md).

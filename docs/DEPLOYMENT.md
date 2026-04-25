# Despliegue en producción

Esta es la guía canónica de despliegue para SmartEconomat. Describe el comportamiento real del stack actual y las implicaciones de `docker-compose.prod.yml`, `scripts/deploy.sh` y `frontend/smart-economat-frontend/nginx.conf`.

## Alcance

- Host recomendado: Linux con Docker Engine y Docker Compose disponibles.
- Stack de producción: PostgreSQL, Redis, backend NestJS y frontend Nginx con TLS local.
- Despliegue automatizado disponible mediante [scripts/deploy.sh](../scripts/deploy.sh).
- Casos específicos: [PRODUCTION.md](PRODUCTION.md) para un escenario Linux con `nip.io`, y [Windows-Deployment.md](Windows-Deployment.md) para hosts Windows con contenedores Linux.
- Entorno local HTTPS con dominio fijo: [operations/local-https-smarteconomat-app.md](operations/local-https-smarteconomat-app.md).
- Gestión TLS detallada: [security/self-signed-tls.md](security/self-signed-tls.md).

## Arquitectura de runtime

| Servicio | Función | Exposición | Notas |
| --- | --- | --- | --- |
| `db` | PostgreSQL con imagen custom | Interna | Volumen persistente `database_prod` |
| `redis` | Caché y soporte de runtime | Interna | AOF activado |
| `backend` | API NestJS | Interna | No publica el puerto `3000` al host en el compose de producción |
| `frontend` | Nginx + frontend compilado | `80`, `443` y `5173:80` | Proxy inverso solo para `/api/` |

## Requisitos previos

- Docker Engine operativo.
- `docker compose` o `docker-compose` accesible en el host.
- Puertos `80` y `443` abiertos en firewall o security group.
- Dominio apuntando al host cuando se use `TLS_PROVIDER=letsencrypt`.
- Permiso de escritura sobre `.env.prod`, `certs/`, `certs-data/`, `certs-webroot/` y `uploads/`.
- `openssl` disponible en host (instalado automáticamente por `scripts/deploy.sh`).

## Variables mínimas para `.env.prod`

| Variable | Uso |
| --- | --- |
| `DOMAIN` | Dominio base del despliegue |
| `URL_BACKEND_DERIVADA` | URL pública esperada para el backend |
| `URL_FRONTEND_DERIVADA` | URL pública del frontend |
| `POSTGRES_USER` | Usuario de PostgreSQL |
| `POSTGRES_PASSWORD` | Contraseña de PostgreSQL |
| `POSTGRES_DB` | Nombre de base de datos único (fuente de verdad) |
| `DB_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | Configuración efectiva de TypeORM |
| `JWT_SECRET` | Secreto de firma JWT |
| `JWT_EXPIRATION` | Expiración del token |
| `TLS_PROVIDER` | Proveedor TLS del script (`selfsigned` por defecto, `letsencrypt` opcional) |
| `TLS_SELF_SIGNED_DAYS` | Días de validez del certificado autofirmado |
| `LETSENCRYPT_EMAIL` | Email para registro en Let's Encrypt (solo si `TLS_PROVIDER=letsencrypt`) |
| `LETSENCRYPT_DIRECTORY_URL` | Endpoint ACME de Let's Encrypt (`prod` o `staging`, solo para deploy script) |

Variables opcionales frecuentes: `SENTRY_DSN`, `VITE_SENTRY_DSN`, `VITE_PROXY_DERIVADO`.

## Opción recomendada: despliegue automatizado

El script [scripts/deploy.sh](../scripts/deploy.sh) realiza estas acciones:

1. Instala dependencias del host si faltan (`zip`, `unzip`, `curl`, `ufw`, Docker).
2. Limpia el release anterior preservando datos persistentes, descomprime el paquete y restaura `certs`, `certs-data`, `certs-webroot` y `uploads` si existían.
3. Configura `.env.prod` con los valores exportados en el shell.
4. Genera certificados TLS autofirmados (o usa Let's Encrypt si `TLS_PROVIDER=letsencrypt`).
5. Libera caché de Docker no usada y arranca `docker-compose.prod.yml`.
6. Finaliza el despliegue dejando disponible un backup ligero de los datos persistentes restaurados.

> [!WARNING]
> El script no hace reset automático de la base de datos. Los datos persistentes viven en volúmenes Docker y directorios restaurados (`certs`, `certs-data`, `certs-webroot`, `uploads`).

## Opción manual

### 1. Preparar entorno y directorios

```bash
mkdir -p certs certs-data certs-webroot uploads
cp .env.example .env.prod
```

Edita `.env.prod` con valores reales de producción.

### 2. Arrancar el stack

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

Si el host usa `docker-compose` clásico:

```bash
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

### 3. Certificados TLS

Por defecto, `scripts/deploy.sh` genera un certificado autofirmado local para `DOMAIN` y `api.DOMAIN` y crea symlinks estables en `certs/fullchain.pem` y `certs/privkey.pem`.

Si el despliegue es DigitalOcean y se desea certificado público, el mismo script puede operar en modo `TLS_PROVIDER=letsencrypt`.

Si ya existen certificados en `certs/live/<domain>/`, Nginx usa los symlinks estables `certs/fullchain.pem` y `certs/privkey.pem`.

Para el flujo completo de generación, renovación, rutas y requisitos, consulta [security/self-signed-tls.md](security/self-signed-tls.md).

## Proxy, HTTPS y Swagger

- Nginx redirige todo HTTP a HTTPS.
- Nginx solo proxya `location /api/` hacia `http://backend:3000`.
- El frontend está servido como SPA con `try_files $uri $uri/ /index.html`.

> [!IMPORTANT]
> La documentación Swagger del backend sigue estando en `/docs` dentro del propio proceso NestJS, pero el proxy de producción actual no publica esa ruta externamente.
>
> En otras palabras:
> - en local o con acceso directo al backend: `http://localhost:3000/docs`;
> - en producción estándar con el Nginx actual: Swagger no queda expuesto al exterior salvo que se añada una regla explícita de proxy para `/docs` o se publique el backend de otro modo.

## Operación diaria

### Ver logs

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod logs -f
docker compose -f docker-compose.prod.yml --env-file .env.prod logs -f backend
docker compose -f docker-compose.prod.yml --env-file .env.prod logs -f frontend
```

### Reiniciar servicios

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod restart
```

### Reconstruir tras cambios

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

### Detener el stack

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod down
```

### Exportar base de datos

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod exec -T db \
  pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > backup_$(date +%F).sql
```

## Verificación posterior al despliegue

1. Comprobar que el frontend responde en `https://<DOMAIN>`.
2. Verificar que las llamadas a `/api/` devuelven JSON y no `index.html`.
3. Confirmar que existen `certs/fullchain.pem` y `certs/privkey.pem` apuntando a la línea activa.
4. Revisar logs de `backend`, `db` y `frontend` tras el arranque inicial.
5. Si se necesita Swagger en producción, planificar una regla adicional de proxy antes de anunciar esa URL como pública.

# Despliegue en producción

Esta es la guía canónica de despliegue para SmartEconomat. Describe el comportamiento real del stack actual y las implicaciones de `docker-compose.prod.yml`, `scripts/deploy.sh` y `frontend/smart-economat-frontend/nginx.conf`.

## Alcance

- Host recomendado: Linux con Docker Engine y Docker Compose disponibles.
- Stack de producción: PostgreSQL, Redis, backend NestJS, frontend Nginx y Certbot.
- Despliegue automatizado disponible mediante [scripts/deploy.sh](../scripts/deploy.sh).
- Casos específicos: [PRODUCTION.md](PRODUCTION.md) para un escenario Linux/Azure con `nip.io`, y [Windows-Deployment.md](Windows-Deployment.md) para hosts Windows con contenedores Linux.

## Arquitectura de runtime

| Servicio | Función | Exposición | Notas |
| --- | --- | --- | --- |
| `db` | PostgreSQL con imagen custom | Interna | Volumen persistente `database_prod` |
| `redis` | Caché y soporte de runtime | Interna | AOF activado |
| `backend` | API NestJS | Interna | No publica el puerto `3000` al host en el compose de producción |
| `frontend` | Nginx + frontend compilado | `80`, `443` y `5173:80` | Proxy inverso solo para `/api/` |
| `certbot` | Emisión y renovación Let's Encrypt | Interna | Usa `webroot` compartido con Nginx |

## Requisitos previos

- Docker Engine operativo.
- `docker compose` o `docker-compose` accesible en el host.
- Puertos `80` y `443` abiertos en firewall o security group.
- Dominio apuntando al host si se van a emitir certificados reales.
- Permiso de escritura sobre `.env.prod`, `certs/`, `certs-data/`, `certs-webroot/` y `uploads/`.

## Variables mínimas para `.env.prod`

| Variable | Uso |
| --- | --- |
| `DOMAIN` | Dominio base del despliegue |
| `BACKEND_API_URL` | URL pública esperada para el backend |
| `FRONTEND_API_URL` | URL pública del frontend |
| `POSTGRES_USER` | Usuario de PostgreSQL |
| `POSTGRES_PASSWORD` | Contraseña de PostgreSQL |
| `POSTGRES_DB` | Base de datos principal |
| `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE` | Configuración efectiva de TypeORM |
| `JWT_SECRET` | Secreto de firma JWT |
| `JWT_EXPIRATION` | Expiración del token |
| `ACME_DIRECTORY_URL` | Endpoint ACME de Let's Encrypt o staging |
| `ACME_EMAIL` | Email usado para Certbot |

Variables opcionales frecuentes: `SENTRY_DSN`, `VITE_SENTRY_DSN`, `VITE_API_PROXY_TARGET`.

## Opción recomendada: despliegue automatizado

El script [scripts/deploy.sh](../scripts/deploy.sh) realiza estas acciones:

1. Instala dependencias del host si faltan (`zip`, `unzip`, `curl`, `ufw`, Docker).
2. Descomprime el paquete de aplicación y restaura `certs`, `certs-data`, `certs-webroot` y `uploads` si existían.
3. Configura `.env.prod` con los valores exportados en el shell.
4. Emite o renueva certificados SSL.
5. Arranca `docker-compose.prod.yml`.
6. Ejecuta `node dist/seeders/seed.js reset` dentro del backend.

### Advertencia importante

El paso 6 reinicia y repuebla la base de datos. Con el script en su estado actual, es apto para aprovisionamiento inicial o entornos donde un reset de datos sea aceptable; no es un flujo seguro para actualizar una producción con datos persistentes.

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

### 3. Certificados SSL

El servicio `certbot` intenta emitir certificados para `DOMAIN` y `api.DOMAIN` usando `webroot`. Nginx sirve `/.well-known/acme-challenge/` desde `certs-webroot/`.

Si ya existen certificados en `certs/live/<domain>/`, Nginx usa los symlinks estables `certs/fullchain.pem` y `certs/privkey.pem`.

## Proxy, HTTPS y Swagger

- Nginx redirige todo HTTP a HTTPS.
- Nginx solo proxya `location /api/` hacia `http://backend:3000`.
- El frontend está servido como SPA con `try_files $uri $uri/ /index.html`.

### Consecuencia operativa

La documentación Swagger del backend sigue estando en `/docs` dentro del propio proceso NestJS, pero el proxy de producción actual no publica esa ruta externamente. En otras palabras:

- en local o con acceso directo al backend: `http://localhost:3000/docs`;
- en producción estándar con el Nginx actual: Swagger no queda expuesto al exterior salvo que se añada una regla explícita de proxy para `/docs` o se publique el backend de otro modo.

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
3. Confirmar que `certbot` ha creado o renovado certificados válidos.
4. Revisar logs de `backend`, `db` y `frontend` tras el arranque inicial.
5. Si se necesita Swagger en producción, planificar una regla adicional de proxy antes de anunciar esa URL como pública.

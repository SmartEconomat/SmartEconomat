# TLS Autofirmado y Modo DigitalOcean

Este documento define el flujo oficial de certificados TLS en SmartEconomat:

- Por defecto: certificados **autofirmados locales** (sin dependencia de CA externa).
- Excepción: en despliegue de DigitalOcean, `scripts/deploy.sh` puede usar **Let's Encrypt** si se habilita explícitamente.

## Modo por defecto (autofirmado)

Variables mínimas en `.env.prod`:

```env
TLS_PROVIDER=selfsigned
TLS_SELF_SIGNED_DAYS=825
DOMAIN=example.com
```

Comportamiento:

1. `scripts/deploy.sh` genera certificado y clave con `openssl` en `certs/live/selfsigned/`.
2. Crea symlinks estables:
   - `certs/fullchain.pem -> certs/live/<lineage>/fullchain.pem`
   - `certs/privkey.pem -> certs/live/<lineage>/privkey.pem`
3. Nginx carga siempre desde esos symlinks estables.

## Modo opcional DigitalOcean (Let's Encrypt)

Este modo existe **solo dentro de** `scripts/deploy.sh`.

Variables requeridas:

```env
TLS_PROVIDER=letsencrypt
LETSENCRYPT_EMAIL=admin@example.com
LETSENCRYPT_DIRECTORY_URL=https://acme-v02.api.letsencrypt.org/directory
DOMAIN=example.com
```

Opcional para pruebas:

```env
LETSENCRYPT_DIRECTORY_URL=https://acme-staging-v02.api.letsencrypt.org/directory
```

Comportamiento:

1. Emisión inicial por `certbot/certbot` en modo `standalone` desde el script.
2. Renovación mediante `scripts/deploy.sh --renew` (cron automático solo en este modo).
3. Si la emisión falla, el script genera certificado autofirmado de respaldo para no romper el arranque.

## Rutas de almacenamiento

En host:

- `certs/`: certificados y symlinks estables.
- `certs-data/`: estado interno de certbot (solo relevante en modo Let's Encrypt).
- `certs-webroot/`: webroot para challenge HTTP-01 en renovaciones Let's Encrypt.

En contenedores:

- Frontend Nginx lee certificados desde `/etc/nginx/certs/fullchain.pem` y `/etc/nginx/certs/privkey.pem`.

## Seguridad y cumplimiento

Reglas obligatorias:

- Nunca subir certificados o claves privadas al repositorio.
- Mantener `*.pem`, `*.key`, `*.crt`, `*.csr`, `certs/`, `certs-data/`, `certs-webroot/` ignorados por git.

Verificación recomendada antes de commit:

```bash
git ls-files | grep -E '\\.(pem|key|crt|csr)$|^(certs|ssl|certificates|certs-data|certs-webroot)/'
```

La salida debe estar vacía.

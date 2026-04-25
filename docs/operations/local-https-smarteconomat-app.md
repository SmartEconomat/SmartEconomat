# Produccion local por HTTPS con smarteconomat.app

Esta guia prepara un entorno local de produccion con:

- Dominio local `https://smarteconomat.app`
- Certificado TLS emitido por una CA local de SmartEconomat
- Stack de `docker-compose.prod.yml` listo para HTTPS

## Requisitos

- Linux, macOS o Windows con Docker y Docker Compose.
- `openssl` disponible en el host.
- Permisos de administrador para confiar la CA y abrir puertos 80/443 si el firewall lo exige.

## Paso 1: preparar certificados y `.env.prod`

Desde la raiz del repo:

```bash
bash ./scripts/setup-smarteconomat-local.sh
```

Este script hace automaticamente en Linux/macOS:

- Genera CA local en `certs/local-ca/` si no existe.
- Emite certificado servidor para `smarteconomat.app` y `api.smarteconomat.app`.
- Detecta la IP LAN del host y la incluye en el certificado para que `https://<ip-lan>` funcione sin warning.
- Actualiza symlinks estables:
  - `certs/fullchain.pem`
  - `certs/privkey.pem`
- Ajusta variables en `.env.prod`:
  - `DOMAIN=smarteconomat.app`
  - `URL_FRONTEND_DERIVADA=https://smarteconomat.app`
  - `URL_BACKEND_DERIVADA=https://smarteconomat.app/api/v1`
  - `DB_SYNC=false`
  - `TLS_PROVIDER=selfsigned`
  - `SEED_DEFAULT_ADMIN_TEMP_PASSWORD` (si no existia)

En Windows, usa:

```powershell
powershell -ExecutionPolicy Bypass -File "scripts/setup-smarteconomat-local.ps1"
```

El script de Windows hace lo mismo y además crea reglas de firewall para 80/443.

## Paso 2: configurar dominio local en `/etc/hosts`

Puedes hacerlo automatico con:

```bash
bash ./scripts/setup-smarteconomat-local.sh
```

O manualmente, anadiendo esta linea en `/etc/hosts`.

Sustituye `IP_LAN_DEL_HOST` por la IP real del equipo donde corre el stack:

```text
IP_LAN_DEL_HOST smarteconomat.app api.smarteconomat.app
```

## Paso 3: confiar la CA local de SmartEconomat

En Debian/Ubuntu:

```bash
sudo cp certs/local-ca/smarteconomat-local-root-ca.crt /usr/local/share/ca-certificates/smarteconomat-local-root-ca.crt
sudo update-ca-certificates
```

## Paso 4: levantar produccion local

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

## Verificacion

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod ps
curl -I https://smarteconomat.app
```

Resultado esperado:

- Frontend accesible por `https://smarteconomat.app` en el host configurado
- Frontend accesible por `https://<ip-lan-del-host>` desde cualquier equipo de la misma red
- Redireccion de HTTP a HTTPS activa
- Certificado emitido por la CA local de SmartEconomat (sin warning tras confiar CA)

## Notas

- Si regeneras certificado o CA, vuelve a ejecutar la importacion en el trust store.
- Si cambias de dominio, ejecuta de nuevo el script con variables `LOCAL_DOMAIN` y `LOCAL_API_DOMAIN`.
- Si quieres que otros dispositivos de la red resuelvan `smarteconomat.app` sin tocar sus hosts, debes publicar ese nombre en tu DNS local o en el router; el script no puede modificar la red completa desde un solo equipo.

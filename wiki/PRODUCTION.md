# Escenario productivo en Linux/Azure

Este documento complementa [DEPLOYMENT.md](DEPLOYMENT.md) con un escenario concreto: una VM Linux en Azure usando `nip.io` para pruebas o validaciones previas a disponer de un dominio definitivo.

## Cuándo usar este escenario

- Validación rápida de un despliegue HTTPS sin dominio corporativo.
- Entornos de demo, QA o preproducción temporal.
- Migraciones donde todavía no existe DNS definitivo.

No es la opción recomendada para un entorno estable de producción a largo plazo.

## Configuración mínima de `.env.prod`

Ejemplo con IP pública `48.220.49.43`:

```env
DOMAIN=48.220.49.43.nip.io
BACKEND_API_URL=https://api.48.220.49.43.nip.io
FRONTEND_API_URL=https://48.220.49.43.nip.io
```

Además deben definirse las variables habituales de base de datos, JWT y ACME.

## Pasos recomendados

1. Preparar la VM con Docker y puertos `80` y `443` abiertos.
2. Copiar el repositorio o el artefacto de despliegue.
3. Crear `.env.prod` con el dominio `nip.io` correspondiente a la IP pública.
4. Arrancar el stack con:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

5. Verificar la emisión de certificados en los logs del servicio `certbot`.

## Limitaciones importantes del stack actual

- `api.<domain>` resuelve al mismo Nginx del frontend; no existe un virtual host independiente para API.
- El proxy actual solo publica `/api/` hacia el backend.
- Swagger no queda accesible en `https://api.<domain>/docs` ni en `https://api.<domain>/api/v1/docs` con la configuración actual.

Si necesitas un subdominio de API completamente separado o publicar Swagger en producción, hay que ampliar `nginx.conf` o introducir un proxy dedicado.

## Verificación rápida

- Frontend: `https://<DOMAIN>`
- API: `https://<DOMAIN>/api/v1/...`
- Certificados: revisar `docker compose -f docker-compose.prod.yml logs -f certbot`

## Recomendación final

Usa este escenario para validación operativa. Para un entorno oficial, conviene migrar a un dominio real y revisar explícitamente cómo se quiere exponer el backend, la API y la documentación Swagger.

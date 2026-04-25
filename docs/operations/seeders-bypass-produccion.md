# Ejecutar Seeders en Produccion (sin bypass manual)

Guia operativa para ejecutar seeders en produccion con el mecanismo oficial actual.

Ahora el flujo recomendado usa:

- `NODE_ENV=production`
- `SEED_API_BASE_URL=http://localhost:3000`
- `npm run seed -- --force-production`

No se necesita inyectar hooks temporales ni tocar `seed-environment.guard`.

> [!CAUTION]
> Ejecutar seeders en produccion puede crear, modificar o eliminar datos.
> Hazlo solo en ventanas controladas.

## Requisitos

- Acceso SSH al servidor.
- Proyecto desplegado con `docker-compose.prod.yml` y `.env.prod`.
- Servicios `db`, `redis`, `backend` arriba.
- `SEED_DEFAULT_ADMIN_TEMP_PASSWORD` definida en `.env.prod`.

## Comando oficial

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod exec -T backend sh -lc '
  cd /app && \
  NODE_ENV=production \
  SEED_API_BASE_URL=http://localhost:3000 \
  SEED_CONCURRENCY=1 \
  SEED_ENDPOINT_BATCH_CONCURRENCY=1 \
  npm run seed -- --force-production
'
```

Tambien puedes usar el script dedicado dentro del contenedor:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod exec -T backend sh -lc '
  cd /app && \
  SEED_API_BASE_URL=http://localhost:3000 \
  npm run seed:force-production
'
```

## Paso a paso

### 1. Entrar en la VM y posicionarte en el proyecto

```bash
ssh TU_USUARIO@TU_IP_O_HOST
cd /RUTA/AL/PROYECTO/SmartEconomat
```

### 2. Verificar entorno minimo

```bash
grep -E '^(SEED_DEFAULT_ADMIN_TEMP_PASSWORD|DB_SYNC)=' .env.prod
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d db redis backend
docker compose -f docker-compose.prod.yml --env-file .env.prod ps
```

### 3. Ejecutar seed

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod exec -T backend sh -lc '
  cd /app && \
  NODE_ENV=production \
  SEED_API_BASE_URL=http://localhost:3000 \
  SEED_CONCURRENCY=1 \
  SEED_ENDPOINT_BATCH_CONCURRENCY=1 \
  npm run seed -- --force-production
'
```

### 4. Verificar resultado

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod logs --tail=120 backend
docker compose -f docker-compose.prod.yml --env-file .env.prod ps backend
```

Busca una salida tipo:

- `[seed-cli] Seeding completado exitosamente.`
- `OK: ... endpoints cubiertos ...`

> [!TROUBLESHOOTING]
> **El seeder se detiene sin mensaje de fin**
>
> Si el seeder muestra los últimos endpoints (`PATCH /purchase-batches/:id/aceptar -> ok`) pero se queda en espera sin mensaje de conclusión:
>
> 1. **¿Es la primera vez que lo ejecutas?** — Es posible que la imagen anterior no tenía el fix. Necesitas:
>    ```bash
>    git pull                              # Traer cambios recientes
>    docker compose -f docker-compose.prod.yml build --no-cache backend  # Reconstruir
>    docker compose -f docker-compose.prod.yml down backend               # Parar
>    docker compose -f docker-compose.prod.yml --env-file .env.prod up -d backend  # Levantar
>    sleep 5
>    # Reintentar el seed
>    ```
>
> 2. **Si ves el mensaje `[seed-cli] Seeding completado exitosamente.`**, ¡ya está bien! ✅
>    El seeder terminó y el contenedor saldrá automáticamente.

## Notas operativas

- Si necesitas reset previo, ejecuta antes [db-reset-produccion.md](db-reset-produccion.md).
- `SEED_API_BASE_URL` es clave en produccion dentro de Docker: evita que el seeder use `URL_FRONTEND_DERIVADA` (por ejemplo `https://smarteconomat.app`) y falle esperando respuesta HTTP desde el propio contenedor.
- Valor recomendado dentro del contenedor backend: `http://localhost:3000`.
- El backend en produccion ya es plug and play para esquema: al iniciar ejecuta `scripts/prod-bootstrap-runner.js`, que aplica migraciones pendientes automaticamente cuando `STARTUP_RUN_MIGRATIONS=true` (valor por defecto en compose prod).
- Esto elimina la dependencia de correr `migration:run` manualmente antes de seed, siempre que la imagen desplegada incluya las migraciones nuevas.
- El seeder massive ya usa una ruta de logs con fallback escribible (`SEED_LOG_DIR`, `./logs/seeders`, `/tmp/smart-economat-seed-logs`) para evitar errores de permisos en `dist`.
- Si deseas fijar una ruta concreta de logs:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod exec -T backend sh -lc '
  cd /app && \
  NODE_ENV=production \
  SEED_API_BASE_URL=http://localhost:3000 \
  SEED_LOG_DIR=/tmp/smart-economat-seed-logs \
  npm run seed -- --force-production
'
```
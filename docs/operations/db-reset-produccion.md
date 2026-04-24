# DB Reset en Produccion

Procedimiento operativo para resetear la base en un entorno productivo levantado con Docker Compose.

El comando oficial actual es `npm run db:reset` dentro del contenedor `backend`.

> [!CAUTION]
> Este procedimiento elimina todos los datos de la base de datos objetivo.

## Requisitos

- Acceso SSH al servidor.
- Proyecto desplegado con `docker-compose.prod.yml` y `.env.prod`.
- Servicios `db`, `redis` y `backend` disponibles.
- Variable `SEED_DEFAULT_ADMIN_TEMP_PASSWORD` definida en `.env.prod`.
- **Imagen backend actualizada** (include `db-reset-runner.js`):
  ```bash
  docker compose -f docker-compose.prod.yml build --no-cache backend
  ```

> [!IMPORTANT]
> En `NODE_ENV=production`, el bootstrap de migraciones exige `SEED_DEFAULT_ADMIN_TEMP_PASSWORD`.
> Si no esta definida, el backend entra en bucle de reinicio y el reset no es operativo.

> [!NOTE]
> Si ves error `Cannot find module 'scripts/db-reset-runner.js'`, significa que la imagen no tiene los scripts.
> Solución: ejecutar `git pull` y reconstruir con `docker compose build --no-cache backend`.

## Paso a paso

### 1. Entrar al servidor y posicionarte en el proyecto

```bash
ssh TU_USUARIO@TU_IP_O_HOST
cd /RUTA/AL/PROYECTO/SmartEconomat
```

### 2. Validar variables criticas

```bash
grep -E '^(SEED_DEFAULT_ADMIN_TEMP_PASSWORD|DB_SYNC)=' .env.prod
```

Si no existe `SEED_DEFAULT_ADMIN_TEMP_PASSWORD`, anadela antes de continuar.

### 3. Levantar servicios base

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d db redis backend
```

### 4. Ejecutar reset real

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod exec -T backend sh -lc '
  cd /app && NODE_ENV=production npm run db:reset
'
```

### 5. Verificar estado del backend y tablas

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod ps backend

docker compose -f docker-compose.prod.yml --env-file .env.prod exec -T db sh -lc '
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  -c "SELECT count(*) AS tablas_publicas FROM pg_tables WHERE schemaname='"'"'public'"'"';"
'
```

## Bloque rapido (copiar y pegar)

```bash
ssh TU_USUARIO@TU_IP_O_HOST
cd /RUTA/AL/PROYECTO/SmartEconomat

grep -E '^(SEED_DEFAULT_ADMIN_TEMP_PASSWORD|DB_SYNC)=' .env.prod

docker compose -f docker-compose.prod.yml --env-file .env.prod up -d db redis backend

docker compose -f docker-compose.prod.yml --env-file .env.prod exec -T backend sh -lc '
  cd /app && NODE_ENV=production npm run db:reset
'

docker compose -f docker-compose.prod.yml --env-file .env.prod ps backend
```

## Despues del reset

Si necesitas datos de prueba o de validacion, ejecuta seeders manuales con la guia:

- [Seeders en produccion](seeders-bypass-produccion.md)
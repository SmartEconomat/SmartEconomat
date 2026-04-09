# DB Reset en Produccion

Este procedimiento ejecuta un reset real de base de datos en el entorno de produccion levantado con Docker Compose.

Hace exactamente esto:

- elimina el esquema actual con `schema:drop`
- recrea el esquema con `schema:sync`
- no ejecuta seeders

> [!CAUTION]
> Esto borra todos los datos de la base de datos de produccion.

## Requisitos

- acceso SSH a la maquina virtual
- proyecto desplegado en la VM
- archivos `docker-compose.prod.yml` y `.env.prod` presentes
- contenedores `db`, `redis` y `backend` disponibles
- backend compilado con carpeta `dist`

## Paso a paso

### 1. Entrar en la maquina virtual

```bash
ssh TU_USUARIO@TU_IP_O_HOST
```

### 2. Ir a la raiz del proyecto

```bash
cd /RUTA/AL/PROYECTO/SmartEconomat
pwd
```

### 3. Comprobar que existen los archivos necesarios

```bash
ls -la .env.prod
ls -la docker-compose.prod.yml
```

### 4. Ver el estado actual de los contenedores

```bash
sudo docker-compose -f docker-compose.prod.yml --env-file .env.prod ps
```

### 5. Levantar los servicios necesarios si no estan arriba

```bash
sudo docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d db redis backend
```

### 6. Verificar que el backend tiene la carpeta `dist`

```bash
sudo docker-compose -f docker-compose.prod.yml --env-file .env.prod exec -T backend sh -lc 'ls -la /app/dist && ls -la /app/dist/config'
```

### 7. Si falta `dist` o `typeorm.config.js`, reconstruir el backend

```bash
sudo docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d --build backend
```

### 8. Ejecutar el reset real de la base de datos

```bash
sudo docker-compose -f docker-compose.prod.yml --env-file .env.prod exec -T backend sh -lc '
  NODE_ENV=development node ./node_modules/typeorm/cli.js schema:drop -d dist/config/typeorm.config.js &&
  NODE_ENV=development node ./node_modules/typeorm/cli.js schema:sync -d dist/config/typeorm.config.js
'
```

### 9. Verificar que el esquema se recreo correctamente

```bash
sudo docker-compose -f docker-compose.prod.yml --env-file .env.prod exec -T db sh -lc '
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT count(*) AS tablas_publicas FROM pg_tables WHERE schemaname='\''public'\'';"
'
```

El resultado esperado es un numero mayor que `0`. En este proyecto, lo normal es ver `43` tablas.

### 10. Verificar que el backend sigue levantado

```bash
sudo docker-compose -f docker-compose.prod.yml --env-file .env.prod ps
```

## Bloque completo para copiar y pegar

```bash
ssh TU_USUARIO@TU_IP_O_HOST

cd /RUTA/AL/PROYECTO/SmartEconomat
pwd

ls -la .env.prod
ls -la docker-compose.prod.yml

sudo docker-compose -f docker-compose.prod.yml --env-file .env.prod ps

sudo docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d db redis backend

sudo docker-compose -f docker-compose.prod.yml --env-file .env.prod exec -T backend sh -lc 'ls -la /app/dist && ls -la /app/dist/config'

sudo docker-compose -f docker-compose.prod.yml --env-file .env.prod exec -T backend sh -lc '
  NODE_ENV=development node ./node_modules/typeorm/cli.js schema:drop -d dist/config/typeorm.config.js &&
  NODE_ENV=development node ./node_modules/typeorm/cli.js schema:sync -d dist/config/typeorm.config.js
'

sudo docker-compose -f docker-compose.prod.yml --env-file .env.prod exec -T db sh -lc '
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT count(*) AS tablas_publicas FROM pg_tables WHERE schemaname='\''public'\'';"
'

sudo docker-compose -f docker-compose.prod.yml --env-file .env.prod ps
```

## Comando opcional para ver el nombre real de la base antes del reset

```bash
sudo docker-compose -f docker-compose.prod.yml --env-file .env.prod exec -T db sh -lc 'echo "$POSTGRES_DB"'
```

> [!NOTE]
> - este procedimiento no usa `scripts/deploy.sh`
> - este procedimiento no ejecuta seeders
> - si quieres poblar datos despues del reset, los seeders deben ejecutarse manualmente y por separado
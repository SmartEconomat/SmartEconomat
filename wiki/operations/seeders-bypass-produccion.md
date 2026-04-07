# Ejecutar Seeders en Produccion con Bypass

Esta guia documenta como ejecutar los seeders manualmente en produccion desde la maquina virtual, sin usar el deploy.

Hace exactamente esto:

- prepara el contenedor backend
- crea un bypass temporal del guard de seeders
- ejecuta `dist/seeders/seed.js reset`
- elimina el bypass temporal al terminar

> [!CAUTION]
> Este procedimiento fuerza la ejecucion de seeders en un entorno de produccion.
>
> Usalo solo si sabes exactamente por que lo necesitas.

## Cuando usarlo

- despues de un `db reset` manual
- en una VM de validacion o un entorno productivo controlado
- cuando necesitas poblar datos base y el guard bloquea la ejecucion por `NODE_ENV` o por el nombre de la base de datos

## Cuando no usarlo

- dentro de `scripts/deploy.sh`
- como parte del flujo normal de despliegue
- sobre una base con datos reales que no quieras sobrescribir o mezclar con datos seed

## Requisitos

- acceso SSH a la maquina virtual
- proyecto desplegado en la VM
- archivos `docker-compose.prod.yml` y `.env.prod`
- contenedores `db`, `redis` y `backend` levantados
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

### 3. Comprobar que existe la configuracion de produccion

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

### 6. Verificar que el backend tiene `dist`

```bash
sudo docker-compose -f docker-compose.prod.yml --env-file .env.prod exec -T backend sh -lc 'ls -la /app/dist && ls -la /app/dist/seeders && ls -la /app/dist/config'
```

### 7. Si falta `dist`, reconstruir el backend

```bash
sudo docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d --build backend
```

### 8. Crear el directorio de logs de seeders dentro del contenedor

```bash
sudo docker-compose -f docker-compose.prod.yml --env-file .env.prod exec -u 0 -T backend sh -lc 'mkdir -p /app/dist/seeders/logs && chmod -R 777 /app/dist/seeders/logs'
```

### 9. Ejecutar los seeders con bypass del guard

```bash
sudo docker-compose -f docker-compose.prod.yml --env-file .env.prod exec -T backend sh -c '
  cat > /tmp/seed-bypass.js << "BYPASS"
var M = require("module");
var origResolve = M._resolveFilename;
M._resolveFilename = function(request) {
  var resolved = origResolve.apply(this, arguments);
  if (resolved.indexOf("seed-environment.guard") !== -1) {
    return "/tmp/seed-guard-noop.js";
  }
  return resolved;
};
BYPASS

  cat > /tmp/seed-guard-noop.js << "NOOP"
module.exports.assertDevelopmentSeedEnvironment = function() {};
NOOP

  NODE_ENV=development node --require /tmp/seed-bypass.js dist/seeders/seed.js reset

  rm -f /tmp/seed-bypass.js /tmp/seed-guard-noop.js
'
```

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

sudo docker-compose -f docker-compose.prod.yml --env-file .env.prod exec -T backend sh -lc 'ls -la /app/dist && ls -la /app/dist/seeders && ls -la /app/dist/config'

sudo docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d --build backend

sudo docker-compose -f docker-compose.prod.yml --env-file .env.prod exec -u 0 -T backend sh -lc 'mkdir -p /app/dist/seeders/logs && chmod -R 777 /app/dist/seeders/logs'

sudo docker-compose -f docker-compose.prod.yml --env-file .env.prod exec -T backend sh -c '
  cat > /tmp/seed-bypass.js << "BYPASS"
var M = require("module");
var origResolve = M._resolveFilename;
M._resolveFilename = function(request) {
  var resolved = origResolve.apply(this, arguments);
  if (resolved.indexOf("seed-environment.guard") !== -1) {
    return "/tmp/seed-guard-noop.js";
  }
  return resolved;
};
BYPASS

  cat > /tmp/seed-guard-noop.js << "NOOP"
module.exports.assertDevelopmentSeedEnvironment = function() {};
NOOP

  NODE_ENV=development node --require /tmp/seed-bypass.js dist/seeders/seed.js reset

  rm -f /tmp/seed-bypass.js /tmp/seed-guard-noop.js
'

sudo docker-compose -f docker-compose.prod.yml --env-file .env.prod ps
```

## Variante recomendada si antes quieres limpiar la base

Primero ejecuta la guia de [db reset en produccion](/home/psych/projects/SmartEconomat/wiki/operations/db-reset-produccion.md) y despues vuelve aqui para lanzar los seeders.

## Que hace el bypass

El fichero temporal `/tmp/seed-bypass.js` intercepta la carga del modulo `seed-environment.guard` y la redirige a un modulo temporal no-op.

Eso evita que falle esta validacion:

- `NODE_ENV !== development`
- nombre de base que contiene `prod` o `production`

La conexion real a la base no se altera. Solo se neutraliza el guard de ejecucion.

> [!NOTE]
> - este procedimiento no modifica ningun fichero `.ts`
> - este procedimiento no cambia `scripts/deploy.sh`
> - el bypass vive solo durante esa ejecucion
> - si el seeder falla por datos inconsistentes, el bypass no corrige la logica interna del seeder
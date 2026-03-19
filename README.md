# SmartEconomat

SmartEconomat es una aplicación para gestionar el inventario de ingredientes y materiales en una escuela de cocina, optimizando el control de stock y facilitando la planificación de clases y recetas.

## Requisitos previos

| Herramienta                                  | Versión mínima | Notas                                                         |
| -------------------------------------------- | -------------- | ------------------------------------------------------------- |
| [Docker](https://www.docker.com/get-started) | 23+            | BuildKit habilitado por defecto                               |
| Docker Compose                               | v2.x           | Incluido en Docker Desktop. Usar `docker compose` (sin guion) |
| Git                                          | cualquiera     | Solo para clonar el repositorio                               |

> **El host NO necesita tener Node.js, npm ni ninguna otra herramienta de desarrollo instalada.** Todas las dependencias se resuelven íntegramente dentro de los contenedores Docker.

Notas por SO:

- Windows: usa WSL2 y guarda el repo dentro del sistema de archivos de Linux (por ejemplo, `/home/<usuario>` o `\\wsl$\Ubuntu\home\<usuario>`). Evita rutas NTFS (C:) para mejor rendimiento de volúmenes.
- macOS: Docker Desktop usa VM; el HMR funciona con polling ya configurado.
- Linux: Docker nativo; todo funciona sin cambios.

## Configuración inicial

1. **Clonar el repositorio**  
   Clona el repositorio de SmartEconomat en tu máquina local:

   ```bash
   git clone https://github.com/SmartEconomat/SmartEconomat.git
   cd SmartEconomat
   ```

2. **Configurar variables de entorno**  
   El proyecto utiliza archivos de entorno separados para desarrollo y producción.
   - **Desarrollo**:
     Asegúrate de tener el archivo `.env.dev` configurado con tus variables locales.
   - **Producción**:
     Configura el archivo `.env.prod` con las credenciales de producción seguras.

3. **Ejecutar el proyecto**

   ### Entorno de Desarrollo (Hot Reload)

   Ideal para programar. Incluye hot reload automático (HMR) para frontend y backend. No requiere instalar nada en el host.

   **Linux:**

   ```bash
   # Exportar UID/GID del usuario actual para que los archivos creados por los
   # contenedores (ej. uploads/) pertenezcan al usuario del host, no a root.
   export UID GID
   docker compose --env-file .env.dev -f docker-compose.dev.yml up --build
   ```

   **macOS (Intel + Apple Silicon) y Windows (PowerShell / WSL2):**

   ```bash
   docker compose --env-file .env.dev -f docker-compose.dev.yml up --build
   ```

   > En macOS y Windows Docker Desktop, el mapping de permisos es automático. No es necesario exportar `UID`/`GID`.

   | Servicio                | URL                        |
   | ----------------------- | -------------------------- |
   | Frontend (React + Vite) | http://localhost:5173      |
   | Backend (NestJS)        | http://localhost:3000      |
   | Swagger Docs            | http://localhost:3000/docs |
   | Base de Datos           | localhost:5432             |

   El **primer arranque** tarda más porque Docker descarga las imágenes base y compila las dependencias nativas (`bcrypt`, profiler de Sentry). Los arranques posteriores son inmediatos gracias al caché de BuildKit.

   ### Entorno de Producción

   Despliega la aplicación optimizada para producción (imágenes ligeras, sin código fuente montado, sin herramientas de desarrollo).

   ```bash
   docker compose --env-file .env.prod -f docker-compose.prod.yml up --build --detach
   ```

   | Servicio         | URL                   |
   | ---------------- | --------------------- |
   | Frontend (Nginx) | http://localhost:80   |
   | Backend (NestJS) | http://localhost:3000 |

   TLS opcional en prod:
   - Montamos `./certs` en Nginx. Puedes generar certificados locales con [scripts/generate-certs.sh](scripts/generate-certs.sh) y exponer 443 (ya mapeado en compose).
   - Configura `DOMAIN`, `FRONTEND_API_URL` y `BACKEND_API_URL` en [/.env.prod](.env.prod).

4. **Detener el proyecto**

   ```bash
   # Desarrollo — detiene y elimina contenedores (los volúmenes se conservan)
   docker compose --env-file .env.dev -f docker-compose.dev.yml down

   # Producción
   docker compose --env-file .env.prod -f docker-compose.prod.yml down
   ```

## Scripts del Backend

El backend incluye varios scripts útiles para gestionar la base de datos y generar documentación. Estos scripts se ejecutan desde el directorio `backend/smart-economat-backend`.

### Seeders (Datos de Prueba)

Para poblar la base de datos con datos iniciales o de prueba:

- **Todos los seeders**:

  ```bash
  npm run seed
  ```

- **Seeder específico**:
  Puedes ejecutar un seeder específico enviando su nombre como argumento (ej. `usuario`, `producto`, `pedido`, etc.):

  ```bash
  npm run seed -- usuario
  ```

- **Reset de datos**:
  Para reiniciar la base de datos (drop schema + sync) y poblarla nuevamente:
  ```bash
  npm run db:reset
  ```

### Documentación de la API

La documentación interactiva (Swagger) está disponible en tiempo de ejecución:

- Desarrollo: http://localhost:3000/docs
- Producción: https://TU_DOMINIO/docs (si usas TLS y proxy)

### Diagrama Entidad-Relación (ERD)

Para generar un diagrama visual de la estructura actual de la base de datos:

```bash
npm run generate:erd
```

El archivo generado se guardará en `tools/erd/erd.svg`.

> Puedes ejecutar estos comandos dentro del contenedor en ejecución:
>
> ```bash
> docker compose --env-file .env.dev -f docker-compose.dev.yml exec backend npm run seed
> ```

## Notas adicionales

- **Conflicto de puertos**: El entorno de desarrollo y producción usan los mismos puertos (3000, 5173, 5432). Detén uno antes de iniciar el otro.
- **Logs**: Para ver los logs de un servicio concreto:

  ```bash
  # Todos los servicios en desarrollo
   docker compose --env-file .env.dev -f docker-compose.dev.yml logs -f

  # Solo backend
   docker compose --env-file .env.dev -f docker-compose.dev.yml logs -f backend

  # Solo frontend
   docker compose --env-file .env.dev -f docker-compose.dev.yml logs -f frontend
  ```

---

## Arquitectura del entorno de desarrollo Docker

### Dual Volume Strategy (por qué `node_modules` no existe en el host)

Para cada servicio Node.js el compose aplica dos montajes simultáneos:

```
Bind mount:   ./backend/smart-economat-backend  →  /app         (código fuente)
Volumen Docker:  backend_node_modules           →  /app/node_modules  (dependencias)
```

Docker aplica los volúmenes **después** del bind mount. El volumen anónimo de `node_modules` «tapa» la carpeta vacía del bind mount. Result: las dependencias viven **exclusivamente dentro de Docker** y el host no necesita `npm install`.

### Hot Reload cross-platform

Docker Desktop en macOS y Windows **no implementa `inotify`** sobre bind mounts (los watchers de archivos de Linux). Sin configuración explícita, NestJS y Vite nunca detectan cambios.

**Solución aplicada** — polling activado siempre:

| Variable              | Valor    | Servicio                  | Motivo                                                   |
| --------------------- | -------- | ------------------------- | -------------------------------------------------------- |
| `CHOKIDAR_USEPOLLING` | `true`   | Backend + Frontend        | Fuerza polling en chokidar (watcher de NestJS y Vite)    |
| `CHOKIDAR_INTERVAL`   | `500` ms | Backend + Frontend        | Balance entre reactividad y CPU. Ajustable en `.env.dev` |
| `WATCHPACK_POLLING`   | `true`   | Backend                   | Preventivo para herramientas webpack-based               |
| `watch.usePolling`    | `true`   | Frontend (vite.config.ts) | Polling nativo de Vite                                   |

En Linux nativo, el overhead del polling es < 0.3% de CPU. En macOS/Windows es la única forma de que HMR funcione.

### Dependencias nativas (Sentry profiler)

`@sentry/profiling-node` usa binarios nativos; el Dockerfile.dev del backend incluye `python3`, `make` y `g++` para compilar dentro del contenedor. `bcrypt@^6` es JS puro (no compila nativo), evitando problemas multiplataforma.

### Arquitectura agnóstica ARM64 + AMD64

Ambos Dockerfiles usan `FROM --platform=$BUILDPLATFORM`. Docker BuildKit selecciona automáticamente la arquitectura correcta:

- En Mac M1/M2/M3 (ARM64): compila y corre nativamente sin emulación.
- En x86_64: comportamiento estándar.
- En CI multi-arch: funciona sin cambios.

### Entrypoints inteligentes (hash-based reinstall)

Ambos servicios tienen un script de entrypoint que compara el hash SHA-256 del `package-lock.json` contra el último hash registrado:

```
[Arranque] → sha256(package-lock.json) == hash guardado?
   ├── SÍ → Saltar instalación → Arrancar app
   └── NO → npm ci → Guardar nuevo hash → Arrancar app
```

Esto garantiza que si un compañero hace `git pull` con nuevas dependencias, el contenedor las instala automáticamente en el siguiente `docker compose up`, sin necesidad de `--build`.

---

## Solución de problemas comunes

### Las dependencias cambiaron tras un `git pull` y hay errores "Module not found"

El entrypoint detecta automáticamente el cambio de lockfile y reinstala. Si por alguna razón no lo hace, fuerza la reinstalación borrando solo el volumen de `node_modules`:

```bash
# Borrar SOLO el volumen de node_modules (la base de datos NO se ve afectada)
docker volume rm smarteconomat-dev_backend_node_modules
docker volume rm smarteconomat-dev_frontend_node_modules

# Volver a arrancar — el entrypoint reinstalará al detectar node_modules vacío
docker compose --env-file .env.dev -f docker-compose.dev.yml up
```

Alternativamente, para forzar un rebuild completo de las imágenes:

```bash
# -V recrea todos los volúmenes anónimos (NO afecta la base de datos, que usa
# un volumen nombrado `database_dev`)
docker compose --env-file .env.dev -f docker-compose.dev.yml up --build -V
```

### Reset total del entorno de desarrollo

```bash
# Elimina contenedores + volúmenes nombrados (INCLUYE la base de datos)
docker compose --env-file .env.dev -f docker-compose.dev.yml down -v

# Rebuild desde cero sin caché
docker compose --env-file .env.dev -f docker-compose.dev.yml build --no-cache
docker compose --env-file .env.dev -f docker-compose.dev.yml up
```

### Problemas con la estructura de compilación o caché

Si el servidor no arranca por errores estructurales o restos de builds anteriores:

1. Elimina la carpeta `dist` local (si existe) para evitar interferencias con el volumen montado.
2. Asegúrate de no tener archivos `.ts` en la raíz del proyecto backend que no pertenezcan a la carpeta `src` (ej: archivos de configuración en formato TS que no estén excluidos en `tsconfig.build.json`), ya que pueden alterar la estructura de salida del compilador.

### El hot reload no funciona (cambios en `.tsx`/`.ts` no se reflejan)

1. Verifica que el contenedor tenga `CHOKIDAR_USEPOLLING=true` en sus variables de entorno:
   ```bash
   docker compose --env-file .env.dev -f docker-compose.dev.yml exec frontend env | grep CHOKIDAR
   ```
2. Si usas **Windows con Hyper-V** (no WSL2), asegúrate de que la carpeta del proyecto esté en la unidad `C:\` y no en una unidad de red.
3. Aumenta el intervalo de polling en `.env.dev` si el HMR es errático en máquinas con muchos archivos:
   ```
   CHOKIDAR_INTERVAL=1000
   ```

### Comandos útiles

- Entrar a un shell dentro de los contenedores:
  ```bash
  docker compose --env-file .env.dev -f docker-compose.dev.yml exec backend sh
  docker compose --env-file .env.dev -f docker-compose.dev.yml exec frontend sh
  ```
- Ejecutar tests backend dentro del contenedor:
  ```bash
  docker compose --env-file .env.dev -f docker-compose.dev.yml exec backend npm test
  ```
  Ejecutar tests frontend:
  ```bash
  docker compose --env-file .env.dev -f docker-compose.dev.yml exec frontend npm run test
  ```

---

## 📚 Documentación Adicional

- [Centralización de configuración](wiki/CENTRALIZACION_CONFIGURACION.md)
- Arquitectura: [wiki/architecture/backend.md](wiki/architecture/backend.md), [wiki/architecture/frontend.md](wiki/architecture/frontend.md)
- Despliegue: [wiki/DEPLOYMENT.md](wiki/DEPLOYMENT.md), [wiki/PRODUCTION.md](wiki/PRODUCTION.md)

**SmartEconomat - Todos los derechos reservados**  
Este software es propiedad exclusiva de sus creadores. Queda estrictamente prohibido copiar, modificar, distribuir, sublicenciar o utilizar el software, en su totalidad o en parte, sin la autorización explícita y por escrito de los propietarios. Cualquier uso no autorizado constituye una violación de los derechos de propiedad intelectual y puede estar sujeto a acciones legales.

Para solicitudes de uso o licencias, contacta a los propietarios del proyecto en **darelmartinezcaballero@gmail.com**.

---

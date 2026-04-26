# Instalacion

## Opciones de instalacion

- **Recomendada**: Docker Compose (entorno controlado).
- **Alternativa**: ejecucion local por proyecto (`backend`, `frontend`, `ElectronInstaller`).

## 1) Instalacion con Docker (desarrollo)

### Requisitos

- Docker + Docker Compose v2
- Git

### Pasos

1. Clonar y entrar en repo.
2. Preparar variables:
   - Copiar `.env.example` a `.env.dev`.
3. Arrancar:

```bash
docker compose -f docker-compose.dev.yml up --build
```

### Servicios esperados

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000/api/v1`
- Swagger: `http://localhost:3000/api/v1/docs`

## 2) Instalacion para produccion (compose)

1. Preparar `.env.prod` (o fichero apuntado por `SMARTECONOMAT_ENV_FILE`).
2. Arrancar:

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

3. Verificar:

- Frontend: `http(s)://<dominio>`
- Backend healthcheck en contenedor (`/api/v1`)

## 3) Instalacion local por paquetes (sin Docker)

Requiere Node `>=22.2.0`.

### Backend

```bash
cd backend/smart-economat-backend
npm ci
npm run start:dev
```

### Frontend

```bash
cd frontend/smart-economat-frontend
npm ci
npm run dev
```

### ElectronInstaller

```bash
cd ElectronInstaller
npm ci
npm run dev
```

## 4) Detener servicios Docker

```bash
docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose.prod.yml down
```

## Errores frecuentes de instalacion

- Puerto ocupado (`3000`, `5173`, `5432`, `80`, `443`).
- Variables criticas sin definir en `.env.prod` (`JWT_SECRET`, `REDIS_PASSWORD`, DB creds).
- Permisos/hosts locales en Windows al probar dominio personalizado.

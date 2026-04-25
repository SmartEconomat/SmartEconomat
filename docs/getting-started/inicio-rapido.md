# Inicio rápido

Esta guía permite levantar SmartEconomat en local con la menor fricción posible. La opción recomendada es Docker Compose, porque ya incorpora PostgreSQL con la extensión UUID v7 personalizada, Redis, backend y frontend.

## Requisitos

| Herramienta | Versión mínima recomendada |
| --- | --- |
| Node.js | `22.2.0` |
| npm | `10` |
| Docker Engine | `24+` |
| Docker Compose | `v2` |
| Git | versión reciente |

## 1. Clonar el repositorio

```bash
git clone <url-del-repositorio> SmartEconomat
cd SmartEconomat
```

## 2. Preparar variables de entorno

```bash
cp .env.example .env.dev
```

Valores mínimos recomendados para desarrollo:

```env
NODE_ENV=development
BACKEND_PORT=3000
URL_BACKEND_DERIVADA=http://localhost:3000
FRONTEND_PORT=5173
URL_FRONTEND_DERIVADA=http://localhost:5173
POSTGRES_PORT=5432
JWT_SECRET=changeme
JWT_EXPIRATION=7d
```

Si usas Docker Compose no necesitas tocar `DB_HOST`: el backend se conecta al servicio `db` dentro de la red interna.

## 3. Arrancar con Docker Compose

```bash
docker compose -f docker-compose.dev.yml up --build
```

Servicios disponibles tras el arranque:

| Servicio | URL o puerto | Notas |
| --- | --- | --- |
| Frontend | `http://localhost:5173` | Vite en modo desarrollo |
| Backend API | `http://localhost:3000/api/v1` | NestJS con recarga |
| Swagger | `http://localhost:3000/docs` | Documentación interactiva local |
| PostgreSQL | `localhost:5432` | Imagen con extensión UUID v7 |
| Redis | red interna Docker | Soporte de caché y runtime |

Comandos útiles:

```bash
docker compose -f docker-compose.dev.yml up -d
docker compose -f docker-compose.dev.yml logs -f backend
docker compose -f docker-compose.dev.yml down
```

## 4. Cargar datos de prueba

Con el backend levantado:

```bash
docker compose -f docker-compose.dev.yml exec backend npm run seed
```

Si necesitas reiniciar el esquema y volver a sembrar:

```bash
docker compose -f docker-compose.dev.yml exec backend sh -c "npm run db:reset && npm run seed"
```

`npm run db:reset` solo hace `schema:drop` + `schema:sync`; el seed debe ejecutarse aparte.

## 5. Alternativa sin Docker

Usa esta opción solo si quieres ejecutar backend y frontend de forma nativa.

### Base de datos

- Instala PostgreSQL localmente.
- Crea la base de datos indicada en tus variables de entorno.
- Si no usas la imagen del proyecto, tendrás que resolver por tu cuenta la disponibilidad de la extensión UUID v7 o adaptar el entorno para desarrollo.

### Backend

```bash
cd backend/smart-economat-backend
cp ../../.env.example .env
npm install
npm run schema:sync
npm run seed
npm run start:dev
```

### Frontend

```bash
cd frontend/smart-economat-frontend
npm install
npm run dev -- --host
```

## 6. Verificación mínima

1. Abrir `http://localhost:5173`.
2. Comprobar que `http://localhost:3000/api/v1` responde.
3. Abrir `http://localhost:3000/docs`.
4. Validar que puedes iniciar sesión con un usuario generado por seed.

## 7. Scripts habituales

### Backend

| Comando | Uso |
| --- | --- |
| `npm run start:dev` | Servidor NestJS en desarrollo |
| `npm run build` | Build de producción |
| `npm run test` | Unit tests |
| `npm run test:e2e` | E2E principal |
| `npm run seed` | Ejecuta seeders |
| `npm run db:reset` | Drop + sync del esquema sin seed |

### Frontend

| Comando | Uso |
| --- | --- |
| `npm run dev` | Servidor Vite |
| `npm run build` | Build de producción |
| `npm run test` | Suite Vitest |
| `npm run lint` | Linting |

## Siguientes lecturas recomendadas

- [Arquitectura backend](../architecture/backend.md)
- [Arquitectura frontend](../architecture/frontend.md)
- [Referencia de API](../reference/api/README.md)
- [Seeders](../development/seeders.md)
- [Troubleshooting](../operations/troubleshooting/README.md)
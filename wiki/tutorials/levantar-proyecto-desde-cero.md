# Tutorial: Levantar el backend desde cero

## Objetivo
Levantar el backend NestJS + TypeORM en entorno local con base de datos lista, datos semilla y API operativa.

## Audiencia
Desarrolladores que se incorporan al proyecto y no han ejecutado el backend antes.

## Resultado esperado
Al finalizar, podrás:
- Levantar la API en `/api/v1`.
- Acceder a Swagger en `/docs`.
- Validar conexión a PostgreSQL.
- Cargar datos de seed para pruebas.

## Prerrequisitos
- Node.js >= 22.2.0
- npm
- Docker Desktop (recomendado para PostgreSQL)
- Git

## Paso 1. Clonar el repositorio
```bash
git clone <url-del-repo>
cd SmartEconomat/backend/smart-economat-backend
```

## Paso 2. Configurar variables de entorno
1. Crea un `.env` en la raíz del backend.
2. Define al menos:
```env
NODE_ENV=development
BACKEND_PORT=3000
FRONTEND_API_URL=http://localhost:5173
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=smart_economat
DB_SYNC=true
JWT_SECRET=change-me
JWT_EXPIRATION=7d
SENTRY_DSN=
```

## Paso 3. Levantar PostgreSQL
### Opción A: Docker Compose (recomendada)
Desde la raíz del repo:
```bash
docker compose -f docker-compose.dev.yml up -d db
```

### Opción B: PostgreSQL local
Asegúrate de crear la base `smart_economat` y de que las credenciales coincidan con `.env`.

## Paso 4. Instalar dependencias del backend
```bash
npm install
```

## Paso 5. Inicializar esquema y datos
### Flujo rápido recomendado en desarrollo
```bash
npm run db:reset
```
Este comando ejecuta:
1. `schema:drop`
2. `schema:sync`
3. `seed`

### Alternativa
```bash
npm run schema:sync
npm run seed
```

## Paso 6. Iniciar servidor en modo desarrollo
```bash
npm run start:dev
```

## Paso 7. Verificar funcionamiento
- Health base: `GET http://localhost:3000/api/v1`
- Swagger: `http://localhost:3000/docs`
- CORS: comprobar origen frontend permitido

## Paso 8. Ejecutar pruebas
```bash
npm run test
npm run test:e2e
```

## Paso 9. Problemas comunes y solución
### Error de conexión a DB
- Verifica `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`.
- Confirma que el contenedor `db` está activo.

### Error de JWT
- Asegura valor no vacío en `JWT_SECRET`.

### Seed bloqueado en producción
- El seeder no debe ejecutarse con `NODE_ENV=production`.

## Siguientes pasos
- [Cómo crear una entidad y relaciones](../how-to/crear-entidad-y-relaciones.md)
- [Cómo generar y aplicar migraciones](../how-to/generar-y-aplicar-migracion.md)
- [Referencia de endpoints](../reference/endpoints.md)

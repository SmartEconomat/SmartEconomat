# Tutorial: levantar el backend desde cero

## Objetivo

Dejar el backend NestJS operativo en local, conectado a PostgreSQL y con datos semilla listos para probar la API.

## Resultado esperado

Al terminar tendrás:

- API disponible en `http://localhost:3000/api/v1`
- Swagger local en `http://localhost:3000/docs`
- Base de datos inicializada y poblada con seeders

## Prerrequisitos

- Node.js `>=22.2.0`
- npm
- Docker Compose para levantar PostgreSQL y Redis de forma sencilla

## Paso 1. Clonar y situarte en el backend

```bash
git clone <url-del-repositorio> SmartEconomat
cd SmartEconomat/backend/smart-economat-backend
```

## Paso 2. Preparar variables de entorno del backend

```bash
cp ../../.env.example .env
```

Revisa al menos estas variables dentro de `.env`:

```env
NODE_ENV=development
BACKEND_PORT=3000
FRONTEND_API_URL=http://localhost:5173
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=app_db
JWT_SECRET=changeme
JWT_EXPIRATION=7d
```

## Paso 3. Levantar base de datos y Redis

Desde la raíz del repositorio:

```bash
docker compose -f docker-compose.dev.yml up -d db redis
```

Esto evita tener que instalar PostgreSQL manualmente y garantiza la imagen preparada para UUID v7.

## Paso 4. Instalar dependencias del backend

```bash
npm install
```

## Paso 5. Inicializar esquema y datos

Flujo recomendado cuando partes de cero:

```bash
npm run db:reset
npm run seed
```

`npm run db:reset` solo ejecuta `schema:drop` y `schema:sync`; el seed debe invocarse de forma explícita.

Si no necesitas borrar el esquema, basta con:

```bash
npm run schema:sync
npm run seed
```

## Paso 6. Iniciar el servidor

```bash
npm run start:dev
```

## Paso 7. Validar el arranque

- `GET http://localhost:3000/api/v1`
- `http://localhost:3000/docs`
- Login con un usuario creado por seed

## Paso 8. Comprobaciones opcionales

```bash
npm run test
npm run test:e2e
```

## Problemas frecuentes

### El backend no conecta con la base de datos

- Verifica `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD` y `DB_DATABASE`.
- Comprueba que el contenedor `db` está levantado.

### Fallan los correos de recuperación

- Revisa `MAIL_HOST`, `MAIL_USER`, `MAIL_PASS` y `MAIL_FROM`.
- Si no configuras SMTP, el backend opera en modo simulación y escribe el intento en logs.

### Swagger no abre

- Asegúrate de que `npm run start:dev` está corriendo y de abrir `http://localhost:3000/docs`.

## Siguientes pasos

- [Crear entidad y relaciones](../how-to/crear-entidad-y-relaciones.md)
- [Generar y aplicar migraciones](../how-to/generar-y-aplicar-migracion.md)
- [Referencia de endpoints](../reference/endpoints.md)
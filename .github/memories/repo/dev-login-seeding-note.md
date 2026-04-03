- Si `POST /api/v1/auth/login` devuelve 400 "Credenciales incorrectas" en local, verificar primero tabla `usuario`; en este repo puede estar vacía tras levantar Docker.
- El 500 en `http://localhost:5173/api/v1/auth/login` suele venir de Vite proxy por `ECONNREFUSED` al backend (`frontend` logs), no necesariamente de Nest.
- `npm run seed` dentro del contenedor `backend` falla porque el seeder invoca `docker compose`; ejecutarlo desde el host en `backend/smart-economat-backend`.
- En tests de servicios Nest con mocks compartidos, `jest.clearAllMocks()` no limpia `mockResolvedValueOnce`; usar `jest.resetAllMocks()` en `beforeEach` evita contaminación entre casos.
- En `seed-massive`, `POST /profesores/slots` y `POST /profesores/admin-slots` deben generar combinaciones únicas de `aula + numeroClase` por profesor; si se reutilizan valores, el backend responde 409 por índice único (`profesor + aula + numeroClase`).
- El flujo masivo actual se ejecuta con `npm run seed` (seed.cli.ts llama a runMassiveSeeder); no existe script `seed:massive` en package.json.

- Para `PATCH /producto-proveedor/:id/precio` en seed masivo, calcular `nuevoPrecio` en base al precio actual del producto-proveedor (mapa `productoProveedorPrecioById` recolectado de respuestas) para evitar 409 por "precio igual al actual".

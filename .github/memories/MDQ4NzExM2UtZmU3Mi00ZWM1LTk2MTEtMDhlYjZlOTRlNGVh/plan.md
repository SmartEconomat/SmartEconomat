# Plan: Proxy backend para OpenFoodFacts (CORS fix)

## TL;DR
El frontend llama directamente a `world.openfoodfacts.org` desde el navegador, pero la API de OFF no soporta correctamente CORS preflight (devuelve 404 al OPTIONS). La solución es crear un proxy en el backend NestJS que haga las peticiones server-side y exponer endpoints REST que el frontend consuma vía `baseFetch`.

## Contexto
- **Error**: CORS preflight 404 al llamar a `https://world.openfoodfacts.org/api/v2/product/...`
- **Causa raíz**: OpenFoodFacts no responde correctamente a OPTIONS preflight del navegador
- **Estado actual**: Frontend → OFF directo (fetch nativo). Backend solo usa OFF en seeders.
- **Nota adicional**: Los códigos de barras en los errores (`20724696-62401144-17`) contienen guiones, lo cual es inusual para EAN — posible bug aparte en barcode handling.

---

## Fase 1: Backend — Nuevo módulo `openfoodfacts`

### Paso 1: Crear módulo NestJS `openfoodfacts`
- Crear carpeta `src/modules/openfoodfacts/`
- Archivos:
  - `openfoodfacts.module.ts`
  - `openfoodfacts.controller.ts`
  - `openfoodfacts.service.ts`
  - `dto/off-product-response.dto.ts`

### Paso 2: Implementar `OpenfoodfactsService`
- Usar `fetch()` nativo (mismo patrón que seeders)
- Dos métodos:
  - `searchByBarcode(code: string): Promise<OffProductDto | null>` → `GET /api/v2/product/{code}?fields=...`
  - `searchByName(name: string): Promise<OffProductDto[]>` → `GET /api/v2/search?search_terms=...`
- Rate limiting simple (throttle en memoria, reutilizar patrón del seeder)
- Timeout configurable vía env var
- Headers con User-Agent identificativo
- Mapeo de respuesta OFF a DTO limpio (reutilizar lógica de parsing del frontend)

### Paso 3: Implementar `OpenfoodfactsController`
- `@ApiTags('OpenFoodFacts')`
- `@UseGuards(JwtAuthGuard)` — solo usuarios autenticados
- Endpoints:
  - `GET /openfoodfacts/producto/:barcode` → `searchByBarcode`
  - `GET /openfoodfacts/buscar?nombre=xxx` → `searchByName`
- Validación de input: barcode no vacío, nombre con longitud mínima

### Paso 4: Registrar módulo en `AppModule`
- Importar `OpenfoodfactsModule` en `app.module.ts`

---

## Fase 2: Frontend — Redirigir llamadas al proxy

### Paso 5: Actualizar `openfoodfacts.service.ts`
- Reemplazar llamadas directas a `world.openfoodfacts.org` por `baseFetch` al backend proxy
- `searchByBarcode(code)` → `baseFetch('/openfoodfacts/producto/{code}')`
- `searchByName(name)` → `baseFetch('/openfoodfacts/buscar?nombre={name}')`
- Mantener la misma interfaz `OFFProduct` y `normalizeOFFAllergens` sin cambios
- Mover el parsing al backend; frontend recibe datos ya mapeados
- Mantener gestión de errores silenciosa (return null / [] si falla)

**No se tocan** los consumidores (`Productos.tsx`, `Inventario.tsx`, `Recepcion.tsx`, `ProductoFormModal.tsx`) ya que la interfaz pública del servicio no cambia.

---

## Archivos relevantes

### Backend (crear)
- `backend/smart-economat-backend/src/modules/openfoodfacts/openfoodfacts.module.ts` — Módulo NestJS
- `backend/smart-economat-backend/src/modules/openfoodfacts/openfoodfacts.controller.ts` — Controlador con 2 endpoints
- `backend/smart-economat-backend/src/modules/openfoodfacts/openfoodfacts.service.ts` — Lógica de proxy + rate limiting
- `backend/smart-economat-backend/src/modules/openfoodfacts/dto/off-product-response.dto.ts` — DTO de respuesta

### Backend (modificar)
- `backend/smart-economat-backend/src/app.module.ts` — Importar `OpenfoodfactsModule`

### Frontend (modificar)
- `frontend/smart-economat-frontend/src/services/openfoodfacts.service.ts` — Redirigir a proxy backend

### Referencia (no modificar)
- `backend/smart-economat-backend/src/seeders/openfoodfacts.seed.ts` — Patrón de rate limiting y fetch a reutilizar
- `backend/smart-economat-backend/src/modules/producto/controller/producto.controller.ts` — Patrón de controlador como template
- `frontend/smart-economat-frontend/src/services/api.service.ts` — `baseFetch` y `parseApiResponse`

---

## Verificación

1. **Build backend**: `npm run build` sin errores en `smart-economat-backend`
2. **Build frontend**: `npm run build` sin errores en `smart-economat-frontend`
3. **Lint**: Sin errores nuevos de ESLint en ambos proyectos
4. **Test manual**: Escanear código de barras desde Inventario/Productos → debe devolver datos de OFF sin error CORS
5. **Test manual**: Buscar producto por nombre → debe devolver resultados
6. **Test edge case**: Código de barras inexistente → debe retornar null/vacío sin error
7. **Errores TypeScript**: `get_errors` en ficheros modificados

---

## Decisiones

- **Sin `@nestjs/axios`**: Usar `fetch()` nativo (Node 18+), consistente con seeders existentes. Evita dependencia nueva.
- **Rate limiting simple**: Throttle en memoria (no Redis) — suficiente para proxy temporal de una API gratuita.
- **Protegido con JWT**: Solo usuarios autenticados pueden usar el proxy. No se expone al público.
- **Mapeo en backend**: El backend devuelve el DTO ya normalizado (nombre, marca, alérgenos mapeados a enums ES). Frontend solo consume.
- **`normalizeOFFAllergens` se mantiene en frontend**: Se duplica lógica mínima en backend, pero se mantiene en frontend por compatibilidad con código existente (se podría eliminar después si se desea).
- **Scope excluido**: No se investiga el formato de barcode con guiones (`20724696-62401144-17`) — puede ser bug aparte.

---

## Consideraciones adicionales

1. **Formato barcode con guiones**: Los errores muestran `20724696-62401144-17` como barcode, que no es un EAN estándar (13 dígitos). ¿Se quiere investigar si hay un bug en cómo se construye el barcode antes de enviarlo a OFF? Recomendación: investigar en paralelo.
2. **Cache de respuestas**: Se podría añadir un cache en memoria (TTL ~1h) para evitar llamadas repetidas a OFF por el mismo barcode. Recomendación: no incluir ahora, añadir si se detecta uso intensivo.

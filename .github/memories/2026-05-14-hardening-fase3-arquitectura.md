# 2026-05-14 — Hardening fase 3: correcciones arquitectónicas pendientes

## Cambios implementados

### MERMA-002 — Sin acción requerida
La entidad `Merma` ya tiene todos los índices necesarios definidos con `@Index`:
`productoId`, `motivo`, `tipo`, `usuarioId`, `createdAt`, `tipo+createdAt`, `origenEntidad+origenId`, `idempotencyKey` (unique).

### PRODUCTO-002 — Eliminación de forwardRef innecesario
- `recepcion.module.ts`: `forwardRef(() => ProductoModule)` → `ProductoModule` (importación directa).
  Fundamento: `ProductoModule` NO importa `RecepcionModule` → no hay dependencia circular real.
- `recepcion-stock.service.ts`: Eliminado `@Inject(forwardRef(() => ProductoService))` →
  inyección estándar de `ProductoService`. Import de `{ Inject, forwardRef }` eliminado.

### PEDIDO-001 — Idempotencia en pedidos
- `pedido.entity.ts`: nuevo campo `idempotencyKey?: string` (unique nullable) + índice parcial.
- `create-pedido.dto.ts`: campo opcional `idempotencyKey?: string` con `@IsUUID`.
- `pedido.service.ts create()`: check temprano — si existe pedido con misma key devuelve el existente.
- Migración: `1776370000000-AddIdempotencyKeyToPedido.ts` (columna + unique partial index).
- Frontend: sin cambios (el key lo genera el cliente opcionalmente).

### DISTRIBUCION-002 — Idempotencia en distribuciones
- `distribucion.entity.ts`: campo `idempotencyKey?: string` + índice parcial unique.
- `create-distribucion.dto.ts`: campo opcional `idempotencyKey?: string`.
- `distribucion.service.ts create()`: check idempotencia antes de la transacción.
- Migración: `1776380000000-AddIdempotencyKeyToDistribucion.ts`.

### USUARIO-002 — Split de UsuarioController
- Nuevo: `usuario-perfil.controller.ts` con `@Controller('usuarios/perfil')`:
  endpoints `GET /`, `GET /catalogo-ubicaciones`, `PATCH /`, `PATCH /mis-ubicaciones`,
  `PATCH /preferences`, `PATCH /password`.
- `usuario.controller.ts` limpiado: eliminados endpoints de perfil (ya en UsuarioPerfilController)
  y JSDoc `@undefined` ruidoso. Solo conserva CRUD admin + gestión de permisos.
- `usuario.module.ts`: registrado `UsuarioPerfilController`.

### RECEPCION-DRAFT-001 — Ruta plural canónica
- Backend: `@Controller('recepcion/draft')` → `@Controller('recepciones/draft')`.
- Frontend `recepcionDraft.service.ts`: todas las URLs actualizadas a `/recepciones/draft`.
  (cambio coordinado — ambos lados actualizados simultáneamente sin breaking change observable).

### UBICACION-001 — Ruta plural canónica
- Backend: `@Controller('ubicacion')` → `@Controller('ubicaciones')`.
- Frontend `ubicacion.service.ts`: todas las URLs actualizadas a `/ubicaciones` (y `/ubicaciones/:id`).
  (cambio coordinado — ambos lados actualizados simultáneamente).

## Nota sobre RECEPCION-002
La modularización de `RecepcionStockService` sigue sin implementar — el servicio supera
las 1200 líneas y concentra la lógica de: recepción simple, recepción masiva, creación de albaranes,
manejo de incidencias y actualización de inventario. Refactorizar sin tests E2E completos
representa un riesgo inaceptable. Se documenta como deuda técnica conocida.

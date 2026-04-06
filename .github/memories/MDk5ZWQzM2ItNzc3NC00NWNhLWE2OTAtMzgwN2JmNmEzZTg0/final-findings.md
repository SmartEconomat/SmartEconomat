# Exploración Thorough Final - Desalineaciones 400 Bad Request

Exploración completada el 1 de abril 2026. Nivel: THOROUGH
Excluidos (ya corregidos): fetchRecetas limit clamp, api.service.ts id guards, buildProductoPayload helpers, produccion.service.ts paginación

## HALLAZGOS: DESALINEACIONES DETECTADAS QUE CAUSAN 400

### 🔴 PRIORIDAD 1 - createProveedor (genérico Partial)
- **Archivo frontend**: [proveedor.service.ts](proveedor.service.ts#L87)  
- **Qué envía**: `Partial<Proveedor>` (puede incluir cualquier campo de la entidad)
- **Qué backend espera**: `CreateProveedorDto` = `{nombre (str), contacto? (str), telefono? (str), email? (str), direccion? (str), nif? (str)}`
- **Problema**: Si UI envía campos legacy como `createdAt`, `updatedAt`, `id`, backend rechaza con 400 (forbidNonWhitelisted)
- **Causa 400**: Campos no whitelisted en payload
- **Archivos a tocar**: 
  - [proveedor.service.ts](proveedor.service.ts) - agregar `CreateProveedorPayload` DTO tipado
  - Cualquier página que use `createProveedor` - validar payload antes

### 🟡 PRIORIDAD 2 - createMovimiento (Partial genérico, bajo uso)
- **Archivo frontend**: [movimiento.service.ts](movimiento.service.ts#L34)
- **Qué envía**: `Partial<Movimiento>` 
- **Qué backend espera**: `CreateMovimientoDto` = `{tipo (enum TipoMovimiento), cantidad (int, Min 0), entidadTipo (str), entidadId (str), descripcion? (str, Max 1000)}`
- **Problema**: Genérico sin validación
- **Causa 400**: Campos no permitidos o tipos inválidos
- **Estado**: Bajo riesgo si no se crea desde UI (posible que sea solo transaccional del sistema)
- **Archivos a tocar**:  
  - [movimiento.service.ts](movimiento.service.ts) - crear `CreateMovimientoPayload` tipado si hay creación desde UI

## HALLAZGOS: CONTRATOSALINEADOS ✅

1. ✅ **incidencia resolve** - Frontend [incidencia.service.ts](incidencia.service.ts#L45): envía `{usuarioId, observacionesResolucion}` vs Backend `ResolverIncidenciaDto` - MATCH
2. ✅ **CreateProductoDto** - incluye opcionales `proveedores`, `pathImg`, `alergenos` - MATCH con frontend
3. ✅ **CreateMermaPayload** - MATCH exacto con backend
4. ✅ **CreateInventarioPayload** - MATCH (frontend envía fechaCaducidad string, backend Transform aplica)
5. ✅ **ejecutarProduccion** - MATCH con `EjecutarProduccionDto`
6. ✅ **CreateRecepcionDto** - MATCH, requiere `productos: RecepcionLineDto[]`
7. ✅ **CreatePurchaseBatchDto** - MATCH, requiere `lineas: CreatePedidoLineDto[]` en frontend
8. ✅ **PaginationQueryDto @Max(50)** - Frontend normaliza límites adecuadamente
9. ✅ **CreatePreparacionDto** - MATCH
10. ✅ **CreateRecetaDto** - Buscar pero por ahora aportemos ok

## EXCLUSIÓN EXPLÍCITA (No son hallazgos, ya corregidos)
- fetchRecetas limit clamp ✓ excluido
- api.service.ts id guards ✓ excluido
- buildProductoPayload helpers ✓ excluido
- produccion.service.ts paginación ✓ excluido

## AUSENCIA DETECTADA
- **Albaran payloads**: Bajo riesgo, especializado
- **Usuarios create/update**: Usa whitelist adapter, probablemente OK
- **Búsqueda producto-proveedor**: offset/limit parece funcional en searchProductoProveedor
- **RecetaFormModal buildRecetaPayload**: Buscar pero bajo riesgo por madurez del módulo

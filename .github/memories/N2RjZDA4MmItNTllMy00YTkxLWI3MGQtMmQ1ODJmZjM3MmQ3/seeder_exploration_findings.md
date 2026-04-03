# Exploraciones de Seeders - Hallazgos Iniciales

## Estructura del Seeding
- **seed.ts**: Ejecuta seeders en orden fijo
- **http-seed.catalog.ts**: Sistema "massive" principal con tareas de siembra HTTP
- **recepcion.seeder.ts y similar**: Wrappers que llaman `runNamedHttpSeeder()` 
- **seed-context.ts**: Gestor de sesión HTTP, login, token, state store

## HALLAZGOS IMPORTANTES

### 1. INCONSISTENCIA CRÍTICA: recepcionTask NO crea recepciones
- **Ubicación**: [http-seed.catalog.ts línea 746](backend/smart-economat-backend/src/seeders/http-seed.catalog.ts#L746)
- **Problema**: Crea solo DRAFTS de recepción, NO crea recepciones reales
- **Comparación**: El antiguo [recepcion.seeder.ts línea ~100-200](backend/smart-economat-backend/src/seeders/recepcion.seeder.ts#L100) SÍ creaba recepciones con `POST /recepciones` con payloads completos
- **Impacto**: Sin recepciones reales, no hay:
  - Actualización de inventario
  - Creación de recepcionProductos
  - Incidencias vinculadas a recepciones reales
  - Albaran vinculados
- **Estado Real**: Las recepciones existen pero NO tienen productos asociados, quedando vacías

### 2. incidenciaTask: Enum check ALINEADO ✅
- **Ubicación**: [http-seed.catalog.ts línea 850-912](backend/smart-economat-backend/src/seeders/http-seed.catalog.ts#L850)
- **DTO**: [report-incidencia.dto.ts](backend/smart-economat-backend/src/modules/incidencia/dto/report-incidencia.dto.ts) valida `@IsEnum(TipoIncidencia)`
- **Enum**: [incidencia.enums.ts](backend/smart-economat-backend/src/modules/incidencia/enums/incidencia.enums.ts)
  - ROTURA, CADUCADO, FALTA_PRODUCTO, EXCESO_PRODUCTO, OTRO
- **Seeder**: Usa exactamente los mismos valores
- **Veredicto**: ✅ CORRECTO

### 3. PROBLEMA POTENCIAL: inventarioTask sin recepción de productos previos
- **Ubicación**: [http-seed.catalog.ts línea 537-615](backend/smart-economat-backend/src/seeders/http-seed.catalog.ts#L537)
- **Lógica**: Crea inventario con cantidades aleatorias sin vínculo a recepciones reales
- **Impacto**: Stock inicial no refleja recepción real, es "mágico" - crea inconsistencia de trazabilidad
- **Relación**: Debería existir `movimiento` de entrada tras recepción

### 4. CRÍTICO: pedidoTask asume `pedidoPendienteIds` que nunca se popula
- **Ubicación**: [http-seed.catalog.ts línea 650-666](backend/smart-economat-backend/src/seeders/http-seed.catalog.ts#L650)
- **Lógica**: 
  ```typescript
  const pendingPedidoIds = (
    context.getState<string[]>('pedidoPendienteIds') || []
  ).slice(0, 5);
  ```
- **Problema**: Nunca se encuentra donde se SET `pedidoPendienteIds` en todo http-seed.catalog.ts
  - Busca fallida por "pedidoPendienteIds"
  - Los pedidos creados no se guardan en este estado
- **Validación requerida**: consolidateExistingOrders requiere estado `PENDIENTE_DE_APROBACION`
- **Impacto**: 
  - Si no hay pending IDs, `consolidateBody` queda vacío
  - El throw() en línea 667 se ejecuta: "purchase batch consolidate requiere pedidos pendientes"
  - **Esto detiene COMPLETAMENTE el seeding en modo estricto**

### 5. CRÍTICO: Flujo de recepción completamente roto
- **Ubicación**: recepcionTask en línea 746+ y antigua lógica en recepcion.seeder.ts
- **Antiguo seeder** (recepcion.seeder.ts): Cargaba pedidos POR_RECEPCIONAR y creaba recepciones reales
- **Nuevo seeder** (http-seed.catalog.ts): Solo crea DRAFTS
- **Consecuencia**: 
  - Sin recepciones reales, NO hay recepcionProductos
  - Sin recepcionProductos, las incidencias NO pueden vincularse correctamente
  - El stock nunca se actualiza por recepciones reales
  - La trazabilidad se rompe

### 6. ESTADO POBLADO INCORRECTO: pedidoPendienteIds nunca se llena
- **Ubicación**: `usuariosTask()` en http-seed.catalog.ts línea ~150-300
- **Búsqueda**: No hay `context.set('pedidoPendienteIds', ...)` en ningún seeder anterior
- Si buscamos en massive.helpers.*, SÍ se popula pero:
  - Solo si se ejecuta `runMassiveSeeder()` de massive.ts
  - Eso NO está en el flujo normal de seed.ts
- **Veredicto**: `pedidoPendienteIds` está VACÍO cuando pedidoTask se ejecuta

### 7. BIFURCACIÓN NO COORDINADA: Massive vs HTTP seeders
- **massive.ts** = Sistema de descubrimiento/ejecución masiva de endpoints
- **http-seed.catalog.ts** = Sistema de tareas HTTP ordenadas
- **Problema**: Ambos sistemas mantienen su propio estado
- **Impacto**: Los cambios de una rama no se reflejan en la otra
- Los pedidos creados en http-seed no se reflejan en massive.state

## RESUMEN FINAL: PROBLEMAS POR SEVERIDAD

### TIER 1 - ROMPE SEEDING COMPLETAMENTE
1. **[http-seed.catalog.ts:650-667]** `pedidoTask` asume `pedidoPendienteIds` → **VACÍO**
   - Línea 667 throws: "purchase batch consolidate requiere pedidos pendientes"
   - ⚠️ DETIENE SEEDING EN MODO ESTRICTO

2. **[http-seed.catalog.ts:746-760]** `recepcionTask` NO crea recepciones reales
   - Solo drafts + manipula recepciones existentes (que están vacías si pedidoTask falló)
   - Sin recepciones reales: NO hay `recepcionProductos`, `albaran`, trazabilidad

### TIER 2 - INCONSISTENCIA LÓGICA (Funciona pero roto)
1. **[http-seed.catalog.ts:537-615]** `inventarioTask` crea stock sin recepción real
   - Stock aparece "mágicamente" sin movimiento de entrada
   - Rompe trazabilidad y auditoría

2. **[http-seed.catalog.ts:850-900]** `incidenciaTask` puede fallar si recepcionIds está vacío
   - Si no hay recepciones, las incidencias son huérfanas
   - Validación: `incidencia.reportarIncidencia()` requiere recepcionId válida

### TIER 3 - ARQUITECTURA FRAGMENTADA
1. **Dos sistemas de state paralelos** (massive.ts vs http-seed.catalog.ts)
   - Cambios en uno no se reflejan en el otro
   - Confunde la lógica de dependencias

## ORDEN DE CORRECCIÓN RECOMENDADO

1. **PRIMERO** (bloqueante): Poblar `pedidoPendienteIds` en una tarea anterior (usuario o producto)
   - O cambiar pedidoTask para NO depender de ella
   - O ejecutar massive.ts ANTES de http-seed.catalog.ts

2. **SEGUNDO** (crítico):  Hacer recepcionTask cree recepciones REALES con productos
   - Usar API `POST /recepciones` con payload completo
   - Vincular pedidos en estado `POR_RECEPCIONAR`

3. **TERCERO** (coherencia): Crear movimientos automáticos cuando se crean inventarios
   - Rastrear entrada inicial de stock

4. **CUARTO** (limpieza): Unificar sistemas de state (massive vs http-seed)
   - O dejar claro cuál es el "canónico"

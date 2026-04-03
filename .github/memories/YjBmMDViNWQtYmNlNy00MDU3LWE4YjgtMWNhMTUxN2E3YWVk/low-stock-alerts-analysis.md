# Análisis Completo: Productos Bajo Mínimo / Low Stock Alerts

## Resumen Ejecutivo
La funcionalidad de "Productos Bajo Mínimo" está implementada en dos niveles:
1. **Dashboard Stats**: Cuenta en tiempo real items bajo stock vía `GET /dashboard/stats`
2. **Alertas Dedicadas**: Endpoint específico `GET /alertas/stock` para detalles
3. **Modal de Resumen**: Frontend muestra lista filtrada al hacer click en el widget

## Flujo Completo

### BACKEND

#### 1. Endpoint Dashboard Stats - `/dashboard/stats`
- **Archivo**: [backend/smart-economat-backend/src/modules/dashboard/controller/dashboard.controller.ts](backend/smart-economat-backend/src/modules/dashboard/controller/dashboard.controller.ts#L20)
- **Línea**: 20-31
- **Query**: Usa directamente QueryBuilder in `dashboard.service.ts:82`
- **Criterio**: `inventario.cantidad_actual < inventario.cantidad_minima`
- **Retorna**: `DashboardStatsDto` con campo `inventario.itemsBajoStock: number`

#### 2. Dashboard Service - Lógica de Conteo
- **Archivo**: [backend/smart-economat-backend/src/modules/dashboard/service/dashboard.service.ts](backend/smart-economat-backend/src/modules/dashboard/service/dashboard.service.ts#L82)
- **Línea**: 75-190
- **Método**: `getStats()`
- **Query específica** (línea 82-84):
  ```
  .createQueryBuilder('inventario')
  .where('inventario.cantidad_actual < inventario.cantidad_minima')
  .getCount()
  ```
- **DTO de respuesta**: [dashboard-stats.dto.ts](backend/smart-economat-backend/src/modules/dashboard/dto/dashboard-stats.dto.ts#L17)
  - Campo: `inventario.itemsBajoStock: number`

#### 3. Endpoint Alertas Stock - `/alertas/stock`
- **Archivo**: [backend/smart-economat-backend/src/modules/inventario/controller/alerta.controller.ts](backend/smart-economat-backend/src/modules/inventario/controller/alerta.controller.ts#L20)
- **Línea**: 20-24
- **Método HTTP**: `GET /alertas/stock`
- **Permiso requerido**: `inventario:ver`
- **Retorna**: `Promise<AlertaStockDTO[]>`

#### 4. Servicio de Alertas Stock
- **Archivo**: [backend/smart-economat-backend/src/modules/inventario/service/inventario.service.ts](backend/smart-economat-backend/src/modules/inventario/service/inventario.service.ts#L292)
- **Línea**: 292-301
- **Método**: `obtenerAlertasStock()`
- **Implementación**:
  ```typescript
  async obtenerAlertasStock(): Promise<AlertaStockDTO[]> {
    const productos = await this.inventarioRepository.findStockBajo();
    return productos.map((p) => ({
      id: p.id,
      cantidadActual: p.cantidadActual,
      cantidadMinima: p.cantidadMinima,
    }));
  }
  ```

#### 5. Query Repository - findStockBajo()
- **Archivo**: [backend/smart-economat-backend/src/modules/inventario/repository/inventario.repository.ts](backend/smart-economat-backend/src/modules/inventario/repository/inventario.repository.ts#L29)
- **Línea**: 29-36
- **Query**:
  ```sql
  WHERE inventario.cantidad_actual < inventario.cantidad_minima
  ```
- **Relaciones incluidas**: producto, proveedor (para datos enriquecidos)

#### 6. DTO AlertaStock
- **Archivo**: [backend/smart-economat-backend/src/modules/inventario/dto/alertaStock.dto.ts](backend/smart-economat-backend/src/modules/inventario/dto/alertaStock.dto.ts)
- **Campos**:
  - `id: string` (UUID del inventario)
  - `cantidadActual: number`
  - `cantidadMinima: number`

### FRONTEND

#### 1. Dashboard Service - Fetch Stats
- **Archivo**: [frontend/smart-economat-frontend/src/services/dashboard.service.ts](frontend/smart-economat-frontend/src/services/dashboard.service.ts#L30)
- **Línea**: 30-40
- **Función**: `fetchDashboardStats()`
- **Endpoint**: `GET /dashboard/stats`
- **Interfaz**: `DashboardStats` con `inventario.itemsBajoStock: number`

#### 2. Home Component - Dashboard Widget
- **Archivo**: [frontend/smart-economat-frontend/src/pages/Home.tsx](frontend/smart-economat-frontend/src/pages/Home.tsx#L514)
- **Línea**: 514 - Extrae `alertasStock` del stats
- **Línea**: 675-687 - Renderiza widget "Alertas de Stock"
- **OnClick**: Abre modal con `openSummary('stock', 'Productos Bajo Mínimo')`
- **Visualización**:
  - Icono: `<WarningAmberIcon />`
  - Color: `error` (rojo)
  - Texto: `"${alertasStock} ítem(s) bajo mínimo"`

#### 3. SummaryModal - Lista Detallada
- **Archivo**: [frontend/smart-economat-frontend/src/components/ui/SummaryModal.tsx](frontend/smart-economat-frontend/src/components/ui/SummaryModal.tsx#L240)
- **Línea**: 240-254 - Manejo del tipo 'stock'
- **Lógica ACTUAL (⚠️ PROBLEMA)**:
  ```typescript
  } else if (type === 'stock') {
    const productos = await fetchAllProductos();
    result = (productos as SummaryProducto[]).filter((producto) => {
      const stockActual = normalizeNumericValue(producto.stockActual);
      const stockMinimo = normalizeNumericValue(producto.stockMinimo);
      return (
        stockActual != null &&
        stockMinimo != null &&
        stockActual <= stockMinimo  // COMPARACIÓN CLIENTE
      );
    });
  }
  ```
- **Renderizado**: [línea 311-330](frontend/smart-economat-frontend/src/components/ui/SummaryModal.tsx#L311)
  - Chipado con color rojo si `stockActual <= stockMinimo`

## PROBLEMAS IDENTIFICADOS ⚠️

### 1. **Inconsistencia en la Comparación** (Crítico)
- **Backend**: Usa `<` (menor que)
  - `inventario.cantidad_actual < inventario.cantidad_minima`
- **Frontend** (SummaryModal): Usa `<=` (menor o igual)
  - `stockActual <= stockMinimo`

**Impacto**: Cuando `stockActual === stockMinimo`, el dashboard contará como "bajo stock" pero el detalle podría no mostrarlo correctamente según la lógica del backend.

### 2. **No Usa Endpoint Dedicado** (Ineficiente)
- **SummaryModal** llama `fetchAllProductos()` (todos los productos)
- **No usa** `GET /alertas/stock` que está implementado en backend
- **Impacto**: 
  - Carga innecesaria de TODOS los productos
  - Filtrado en cliente (menos eficiente)
  - Falta sincronización con dashboard

### 3. **DTO Incompleto**
- **AlertaStockDTO** solo retorna: `id`, `cantidadActual`, `cantidadMinima`
- **Falta**: 
  - Nombre del producto
  - Nombre del proveedor
  - Ubicación del inventario
  - Unidad de medida
  - Información para tomar acciones correctivas

### 4. **Falta Validación en Edge Case**
- **Test pendiente**: `E2E-INV-05` en `tests-faltantes.md:648`
- **Pregunta sin responder**: ¿Es bajo stock cuando `cantidad_actual === cantidad_minima`?

## ARCHIVOS RELEVANTES - RESUMEN

| Componente | Archivo | Línea(s) | Función |
|-----------|---------|----------|---------|
| **Backend Controller** | alerta.controller.ts | 20-24 | `GET /alertas/stock` |
| **Backend Service** | inventario.service.ts | 292-301 | `obtenerAlertasStock()` |
| **Backend Query** | inventario.repository.ts | 29-36 | `findStockBajo()` |
| **Backend DTO** | alertaStock.dto.ts | 4-32 | Estructura respuesta |
| **Dashboard Query** | dashboard.service.ts | 75-190 | `getStats()` - conteo |
| **Dashboard DTO** | dashboard-stats.dto.ts | 1-30 | `itemsBajoStock: number` |
| **Frontend Stats** | dashboard.service.ts | 30-40 | `fetchDashboardStats()` |
| **Frontend Widget** | Home.tsx | 514, 675-687 | Métrica display |
| **Frontend Modal** | SummaryModal.tsx | 240-254, 311-330 | Lista detallada |

## RECOMENDACIONES

1. **Standarizar comparación**: Usar `<` en ambos lados
2. **Usar endpoint dedicado**: `fetchAlertasStock()` en SummaryModal
3. **Enriquecer AlertaStockDTO** con producto/proveedor/ubicación
4. **Resolver edge case**: `cantidadActual === cantidadMinima`
5. **Testing**: Implementar tests en `tests-faltantes.md`

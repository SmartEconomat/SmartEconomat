# SmartEconomat - Exploración Inventario Bajo Stock

## Contexto
Exploración MEDIUM (solo lectura) del contrato de inventario para bajo stock: campos, endpoints, filtros, transformaciones.

## Hallazgos Principales

### Endpoints
1. **GET /inventario** - Listado paginado 
   - Retorna: Inventario entity (incluye cantidadActual, cantidadMinima, cantidadMaxima)
   - DTO: PaginatedResponseDto<Inventario>
   
2. **GET /inventario/stock** - Query stock con filtros
   - Query params: productoId, ubicacionId, **onlyLowStock**, consolidado
   - Retorna: StockPorUbicacionDto[] o StockConsolidadoDto[]
   - ⚠️ NO retorna información de bajo stock (sin cantidadMinima)
   
3. **GET /alertas/stock** - Endpoint separado para alertas
   - Retorna: AlertaStockDTO[] (id, cantidadActual, cantidadMinima, nombreProducto, etc.)
   - Llama internamente a: repository.findStockBajo()
   - Criterio: cantidadActual < cantidadMinima

### Lógica de Bajo Stock
- **Backend**: Define en repository con `findStockBajo()` 
- **Frontend**: Recalcula en `agregarInventarioPorProducto()` 
- **Criterio**: cantidadActual < cantidadMinima

### Ruta Frontend
```
fetchInventario() 
  → GET /inventario 
  → agregarInventarioPorProducto()
  → agrega: bajoStock = cantidadActual < cantidadMinima
  → renderiza: WarningAmberOutlinedIcon si bajoStock=true
```

## Inconsistencias
1. **StockPorUbicacionDto/StockConsolidadoDto** no tienen cantidadMinima ni bajoStock
2. **/alertas/stock existe pero no se usa** en frontend actual (duplicación)
3. **Mismatch de contratos**: /inventario devuelve full entity, /stock devuelve subset sin contexto bajo stock
4. **Lógica duplicada**: Backend calcula en obtenerAlertasStock(), frontend también calcula

## Archivos Clave
- Backend controller: inventario.controller.ts, alerta.controller.ts
- Backend service: inventario.service.ts (queryStock, obtenerAlertasStock, findStockBajo)
- Frontend service: inventario.service.ts (fetchInventario, agregarInventarioPorProducto)
- Frontend page: Inventario.tsx (columna bajoStock con WarningAmberOutlinedIcon)
- DTOs: alertaStock.dto.ts, inventory-query.dto.ts, stock-result.dto.ts

## Tests
- Unit: inventario.service.spec.ts - test para obtenerAlertasStock()
- Faltan: tests e2e para alertas, validación onlyLowStock, coherencia backend-frontend

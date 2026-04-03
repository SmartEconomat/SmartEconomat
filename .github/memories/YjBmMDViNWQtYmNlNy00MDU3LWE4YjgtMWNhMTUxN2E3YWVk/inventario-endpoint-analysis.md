# GET /inventario Endpoint Analysis

## Backend Stack
- **Controller**: GET /inventario with pagination+sorting
- **Service**: findAll() loads relations: productoProveedor → {producto, proveedor}, ubicacion
- **Repository**: inherited findAndCount() + custom findStockBajo()

## Query Consistency
Dashboard `itemsBajoStock` count query:
```sql
WHERE cantidad_actual < cantidad_minima
```

Repository `findStockBajo()` same query + relations loaded.

**Match ✅** — no mismatch between dashboard counter and inventory lookup.

## FrontEnd Aggregation Bug ⚠️
Function: `agregarInventarioPorProducto(items: InventarioItem[])`

**Filter applied**:
```javascript
const result = Array.from(map.values()).filter((row) => row.cantidadTotal > 0);
```

**Problem**: Items with cantidadTotal=0 are hidden, but if cantidadMinima > 0, they should appear as bajo stock alerts.

**Impact**: 
- Dashboard counts items with cantidad_actual < cantidad_minima (includes 0 quantities)
- Frontend hides items with cantidad_actual = 0, even if bajo stock
- **Inconsistency**: user sees different numbers dashboard vs inventory view

**Fix**: Change filter to `(row) => row.cantidadTotal > 0 || row.bajoStock`

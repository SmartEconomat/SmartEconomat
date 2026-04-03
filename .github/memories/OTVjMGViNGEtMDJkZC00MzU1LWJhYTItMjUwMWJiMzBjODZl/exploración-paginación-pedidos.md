# Exploración: Flujo de Listado de Pedidos - Frontend SmartEconomat

## 1. Archivos Principales Identificados

### Página Principal:
- **[src/pages/Pedidos.tsx](src/pages/Pedidos.tsx#L1)** → Componente raíz que integra todo el flujo de pedidos

### Componentes Clave:
- **[src/features/pedidos/components/PedidosTable.tsx](src/features/pedidos/components/PedidosTable.tsx)** → Tabla renderizada con DataTable genérico
- **[src/features/pedidos/components/PedidoCard.tsx](src/features/pedidos/components/PedidoCard.tsx)** → Tarjeta individual (vista grid)
- **[src/features/pedidos/components/PedidosWeeklyBoard.tsx](src/features/pedidos/components/PedidosWeeklyBoard.tsx)** → Vista semanal
- **[src/features/pedidos/components/PurchasesWeeklyBoard.tsx](src/features/pedidos/components/PurchasesWeeklyBoard.tsx)** → Vista semanal compras

### Servicios:
- **[src/services/pedido.service.ts](src/services/pedido.service.ts)** → Servicio central con `fetchPedidos`, `fetchPedidoUsuarios`, `fetchPurchaseBatches`
- **[src/services/pedido.types.ts](src/services/pedido.types.ts)** → DTOs y tipos

### Hooks de Datos:
- **[src/features/pedidos/hooks/usePedidosData.ts](src/features/pedidos/hooks/usePedidosData.ts)** → CRÍTICO: orquesta carga de datos
- **[src/features/pedidos/hooks/usePedidosFilters.ts](src/features/pedidos/hooks/usePedidosFilters.ts)** → Gestiona filtros URL
- **[src/features/pedidos/hooks/usePedidoActions.ts](src/features/pedidos/hooks/usePedidoActions.ts)** → Acciones CRUD

### DataTable Genérico:
- **[src/components/ui/DataTable.tsx](src/components/ui/DataTable.tsx)** → Componente reutilizable con prop `pagination`

## 2. Servicios de Carga

### `fetchPedidos(page, limit, searchTerm, estado, options)`
- **Línea 111**: Función que llama `/pedidos?page=X&limit=Y&...`
- Soporta paginación con `page` y `limit`
- Devuelve `PaginatedData<Pedido>`

### `fetchPedidoUsuarios(page, limit, searchTerm, estado, options)`
- **Línea 145**: Función que llama `/pedido-usuarios?page=X&limit=Y&...`
- Soporta paginación con `page` y `limit`
- Devuelve `PaginatedData<PedidoUsuario>`

### `fetchPurchaseBatches()`
- **Línea 420**: ⚠️ **SIN PAGINACIÓN** - Llama `/purchase-batches` sin parámetros
- Devuelve array completo `PurchaseBatch[]`
- Se usa en tab 2 (batches) de `usePedidosData`

## 3. Estado y Props de Paginación

En **[Pedidos.tsx](Pedidos.tsx#L57-L58)**:
```typescript
const [page, setPage] = useState(1);        // línea 57
const [pageSize, setPageSize] = useState(10); // línea 58
```

En **[PedidosTable.tsx](PedidosTable.tsx#L28-L36)**:
```typescript
pagination={{
  currentPage: page,
  totalPages,
  onPageChange: (_, newPage) => onPageChange(newPage),
  pageSize,
  pageSizeOptions: [5, 10, 25, 50],
  onPageSizeChange: (event) => onPageSizeChange(Number(event.target.value)),
}}
```

En **[DataTable.tsx](DataTable.tsx)** línea ~100:
- Prop `pagination?: { currentPage, totalPages, totalItems?, onPageChange, pageSize?, onPageSizeChange?, pageSizeOptions? }`
- Renderiza `TablePagination` de MUI

## 4. PROBLEMATICA PRINCIPAL: usePedidosData.ts

### Problem 1: Tab 0 (Mis pedidos) - **CARGA TODO SIN RESPETAR PAGINACIÓN**
**[usePedidosData.ts líneas 60-84]**:
```typescript
if (tabIndex === 0 && pedidosResponse.totalPages > 1) {
  const remainingPages = await Promise.all(
    Array.from({ length: pedidosResponse.totalPages - 1 }, (_, index) =>
      fetchPedidoUsuarios(index + 2, effectivePageSize, ...)
    )
  );
  const mergedData = [
    ...pedidosResponse.data,
    ...remainingPages.flatMap((response) => response.data),
  ];
  setData(mergedData.map(mapPedidoUsuarioToPedidoRow));
  setTotalPages(1);  // ⚠️ FUERZA SIN PAGINACIÓN
  return;
}
```

**Efecto**: Carga TODAS las páginas del backend en paralelo y las combina, mostrando como si fuera una sola página.

### Problem 2: Tab 2 (Batches) - **SIN PAGINACIÓN EN BACKEND**
**[usePedidosData.ts línea 49]**:
```typescript
const batchesData = await fetchPurchaseBatches(); // Sin page/limit
setBatches(batchesData);
setTotalPages(1);
```

**[pedido.service.ts línea 420]**:
```typescript
export async function fetchPurchaseBatches(): Promise<PurchaseBatch[]> {
  const response = await baseFetch('/purchase-batches');
  // Sin params
}
```

**Efecto**: Trae todos los lotes sin límite.

### Problem 3: Hardcoded pageSize en algunos tabs
**[usePedidosData.ts línea 56-57]**:
```typescript
const effectivePageSize = tabIndex === 1 || tabIndex === 0 ? 50 : pageSize;
const effectivePage = tabIndex === 0 ? 1 : page;
```

**Efecto**: Ignora `setPageSize` del usuario en tabs 0 y 1; siempre usa 50.

## 5. Otras Páginas que Usan fetchPedidos

### Recepcion.tsx
**[línea 410-415]**:
```typescript
const resp = await fetchPedidos(
  1,
  50,
  '',
  [EstadoPedido.PENDIENTE, EstadoPedido.EN_PROCESO, EstadoPedido.PARCIAL].join(',')
);
setPedidosDisponibles(resp.data as Pedido[]);
```
- Hardcoded: `page=1, limit=50`
- ✅ Soporta paginación en la firma pero solo trae 1 página

### SummaryModal.tsx
**[línea 151, 160]**:
```typescript
const firstPage = await fetchPedidos(1, SUMMARY_PAGE_SIZE, '', estado);
// ... después
fetchPedidos(index + 2, SUMMARY_PAGE_SIZE, '', estado)
```
- ✅ Implementa paginación correctamente con SUMMARY_PAGE_SIZE

## Callbacks Registrados en Pedidos.tsx

**[línea ~200+]**: Props pasadas a `PedidosTable`:
```typescript
<PedidosTable
  ...
  onPageChange={(newPage) => setPage(newPage)}
  onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
/>
```

## Conclusión: LISTA DE CAMBIOS PENDIENTES

| Archivo | Línea | Problema | Símbolo/Función |
|---------|-------|----------|-----------------|
| usePedidosData.ts | 60-84 | Carga ALL pages en tab 0 | Loop de `fetchPedidoUsuarios` |
| usePedidosData.ts | 56-57 | PageSize hardcoded | `effectivePageSize` |
| usePedidosData.ts | 49 | Sin paginación batches | `fetchPurchaseBatches()` |
| pedido.service.ts | 420 | Sin parámetros paginación | `fetchPurchaseBatches()` |
| Recepcion.tsx | 410-415 | Hardcoded limit=50 | `fetchPedidos(1, 50, ...)` |

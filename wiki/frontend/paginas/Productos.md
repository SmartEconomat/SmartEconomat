# Página Productos

## Ubicación real

`src/pages/Productos.tsx`

## Propósito

Esta página concentra la gestión del catálogo de productos: búsqueda, listado, alta, edición, visualización detallada, exportación y operaciones asistidas por código de barras.

## Composición actual

- `PageToolbar` para búsqueda, cambio de vista y acciones globales
- `DataTable` para modo lista
- `ProductCard` para modo grid
- `ProductoFormModal` para alta y edición
- `DetailModal` para detalle del producto
- `ConfirmDialog` para borrado
- `BarcodeScanner` para lectura de códigos de barras

La página ya no usa `DynamicFormModal` como formulario principal.

## Funcionalidades principales

## Búsqueda y filtros

- búsqueda textual
- filtros del catálogo mediante `ProductFilters`
- selector de vista lista o grid

La consulta principal carga productos paginados y proveedores auxiliares; la toolbar concentra también las acciones de exportación.

## Exportación

- exportación a PDF
- exportación a Excel

Ambas reutilizan el estado actual de búsqueda y filtros activos.

## Alta y edición

`ProductoFormModal` construye el payload final mediante `buildProductoPayload`. La página delega en los servicios de producto para crear o actualizar y recarga el listado tras guardar.

## Detalle y trazabilidad comercial

El detalle del producto puede mostrar:

- información general
- proveedores vinculados
- histórico de precios

Existe un filtro específico por proveedor para el histórico cuando el detalle está abierto.

## Escáner y soporte de código de barras

La vista integra `BarcodeScanner` y combina dos estrategias:

- buscar primero en el catálogo interno
- consultar OpenFoodFacts como apoyo cuando corresponde

Esto permite acelerar la localización o prellenado de productos en operaciones de catálogo.

## Permisos relevantes

- `productos:crear`
- `productos:editar`
- `productos:eliminar`

La página usa `usePermission` para decidir qué acciones mostrar, pero la protección real sigue en backend.

## Relacionado

- [Servicio de API](../../reference/api.md)
- [Alta compleja de producto](../../modules/producto/alta-compleja-producto-maestro-proveedores.md)
- [ProductFilters](../componentes/ProductFilters.md)
- [DataTable](../componentes/DataTable.md)
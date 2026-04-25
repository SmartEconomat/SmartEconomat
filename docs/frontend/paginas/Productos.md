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

## Ayuda y Tutoriales Interactivos ✅

La página de Productos cuenta con asistencia contextual avanzada para facilitar la gestión del catálogo:

### Tour de Gestión de Catálogo (8 pasos)
Recorrido interactivo que guía al usuario por:
1. **Búsqueda Inteligente**: Localización por nombre o código de barras.
2. **Filtros Avanzados**: Refinado por categorías.
3. **Ordenado de Datos**: Gestión de columnas en la tabla.
4. **Alta de Productos**: Proceso de creación y escaneo.
5. **Exportación PDF**: Generación de catálogos impresos.
6. **Reportes Excel**: Descarga de datos técnicos.
7. **Acciones de Fila**: Edición, borrado y restauración.
8. **Tutorial del Módulo**: Cómo reiniciar esta ayuda.

### Modo Tips
Al activar el botón **Tips** en el sidebar, se habilitan leyendas explicativas en los iconos de la `DataTable` y etiquetas descriptivas en el `BarcodeScanner`.

## Auditoría de Experiencia y Accesibilidad (Abril 2026) ✅

- **Rendimiento (Anti-CLS)**: Se ha eliminado el parpadeo de contenido durante la carga inicial mediante la sincronización milimétrica de Skeletons y anchos de columna en `DataTable`.
- **Accesibilidad (WAVE Ready)**: Certificada en modo oscuro y alto contraste claro:
  - Etiquetado robusto de todos los inputs de búsqueda y filtros.
  - Tamaño de fuente mínimo garantizado de **0.8rem (12.8px)**.
  - Contraste de texto secundario ajustado al **85% de opacidad** en modo oscuro.
- **UX Premium**: Rediseño del `BarcodeScanner` con animaciones aceleradas por hardware y feedback instantáneo.
- **Estabilidad de Formularios**: Implementación de `preventDefault` en el motor de formularios dinámicos para garantizar que el modal de Producto no se cierre al interactuar con sub-modales (como el de creación de proveedores).
- **Validación Blindada**: Los campos numéricos y de texto en el alta de productos ahora cuentan con límites `maxLength` y validaciones Regex activas para asegurar la integridad de los datos.

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

### Alta Integrada de Proveedores (Quick-Add) ✅
El selector de proveedores en el formulario de alta incluye ahora un botón de acceso rápido ("+") que permite:
1. Abrir el modal `QuickProveedorModal` sin cerrar el proceso actual.
2. Crear un nuevo proveedor con validación estricta de NIF, Email y Teléfono.
3. Al guardar con éxito, el nuevo proveedor se selecciona automáticamente en el formulario de producto y la lista de opciones se refresca dinámicamente.

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

- [Servicio de API](../../reference/api/README.md)
- [Alta compleja de producto](../../modules/producto/alta-compleja-producto-maestro-proveedores.md)
- [ProductFilters](../componentes/ProductFilters.md)
- [DataTable](../componentes/DataTable.md)
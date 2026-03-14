# Página: Gestión de Productos

> **Ubicación:** `src/pages/Productos.tsx`  
> **Última actualización:** 2026-03-07

---

## Propósito

Página principal del catálogo de productos de SmartEconomat. Ensambla el ciclo CRUD completo para la entidad `Producto`:

- **Listar** productos con búsqueda, filtrado por categoría, paginación y vista lista/mosaico.
- **Crear** un producto nuevo mediante un formulario dinámico modal.
- **Editar** cualquier producto existente (el mismo modal reutilizable).
- **Ver detalle** completo en un modal de solo lectura con alérgenos y proveedores.
- **Eliminar** con confirmación.

---

## Composición de componentes

```
Productos.tsx
├── PageToolbar                             Encabezado unificado (Sticky)
│   ├── TextField (búsqueda)                Busca por nombre, marca, código de barras
│   ├── ProductFilters                      Autocomplete multi-select por categoría
│   └── ToggleButtonGroup (Vista)           Cambio entre Lista y Cuadrícula (Grid)
├── DataTable <Producto>                    Tabla/mosaico con paginación coordinada
│   ├── renderGridItem → ProductCard        Vista en tarjeta para el modo mosaico
│   └── renderActions                       Ver / Editar / Eliminar por fila
├── ConfirmDialog                           Confirmación de borrado
├── DynamicFormModal                        Formulario de creación y edición
└── DetailModal                             Vista de detalle con secciones: info, alérgenos, proveedores
```

---

## Estado local (`useState`)

| Variable | Tipo | Descripción |
| :--- | :--- | :--- |
| `page` | `number` | Página actual de la paginación. |
| `pageSize` | `number` | Registros por página (opciones: 4, 8, 12, 24). |
| `totalPages` | `number` | Total de páginas devueltas por el backend. |
| `searchTerm` | `string` | Texto del campo de búsqueda (debounced en backend). |
| `filters` | `ProductFiltersState` | Categorías seleccionadas en `ProductFilters`. |
| `data` | `Producto[]` | Datos cargados del backend. |
| `proveedores` | `Proveedor[]` | Lista de proveedores para el selector del formulario. |
| `isLoading` | `boolean` | Indicador de carga de datos. |
| `error` | `string \| null` | Mensaje de error de red. |
| `productToDelete` | `Producto \| null` | Producto pendiente de confirmación de borrado. |
| `productToEdit` | `Record<string, unknown> \| null` | Datos iniciales del formulario de edición (o `{}` para creación). |
| `productToView` | `Producto \| null` | Producto mostrado en el modal de detalle. |

---

## Barra de búsqueda y filtros (PageToolbar)

La gestión de controles se centraliza en el componente `PageToolbar`, que aloja:

1. **Buscador unificado**: Input de búsqueda con soporte para términos debounced. Dispara recarga al backend en cada keystroke (resetea a página 1).
2. **ProductFilters**: Integración de filtros por categoría con crecimiento dinámico de ancho. Las categorías seleccionadas aparecen como chips con icono dentro del control.
3. **Selector de Vista**: Sincronización del modo Lista/Grid entre la cabecera y la `DataTable`.
4. **Resumen de Inventario**: Conteo total reubicado como un Chip de estado al lado del título ("X productos registrados").
5. **Paginación**: Control de tamaño de página (registros por página) en la barra inferior.

> El modo Grid es el preferido para visualización rápida de productos con imágenes, mientras que el modo List ofrece mayor detalle técnico. No hay una fila secundaria de chips externos; viven dentro del Autocomplete.

---

## Flujo de datos

```
[Usuario escribe / selecciona categoría]
    → setSearchTerm / setFilters → setPage(1)
    → useEffect [page, pageSize, searchTerm] → fetchProductos()
    → setData / setTotalPages
    → DataTable re-renderiza
```

Los filtros de categoría (`filters.categorias`) se aplican **localmente** sobre `filteredData` al usar el array `data` (aunque el TODO es pasarlos al backend en los query params).

---

## Columnas de la tabla

| ID | Etiqueta | Render personalizado | Visibilidad Responsive |
| :--- | :--- | :--- | :---: |
| `nombre` | Nombre | — | Siempre visible |
| `marca` | Marca | `row.marca ?? '—'` | Desktop (`lg`) |
| `tipo` | Tipo | `<StatusChip status={row.tipo} />` | Tablet y Desktop (`sm`+) |
| `contenido` | Contenido | `${contenido} ${unidad}` | Siempre visible |
| `codigoBarras` | Cód. Barras | `row.codigoBarras ?? '—'` | Desktop (`lg`) |

---

## Acciones por fila

| Acción | Componente | Comportamiento |
| :--- | :--- | :--- |
| Ver detalle | `VisibilityIcon` | Abre `DetailModal` con secciones: Info general, Alérgenos, Proveedores. |
| Editar | `EditIcon` | Abre `DynamicFormModal` con datos pre-cargados via `buildEditData()`. |
| Eliminar | `DeleteIcon` | Abre `ConfirmDialog`; al confirmar, llama `DELETE /productos/:id`. |

---

## Formulario dinámico (`DynamicFormModal`)

El esquema `productoSchema` define los campos:

| Campo | Tipo | Requerido |
| :--- | :--- | :---: |
| `nombre` | texto | ✅ |
| `marca` | texto | — |
| `descripcion` | texto | — |
| `contenido` | número | ✅ |
| `unidad` | select (`UnidadMedida`) | ✅ |
| `tipo` | select (`CategoriaProducto`) | — |
| `codigoBarras` | texto | — |
| `imagen` | imagen (upload) | — |
| `alergenos` | allergens (selector especial) | — |
| `proveedores` | proveedores (selector dinámico) | — |

---

## Servicios consumidos

| Método HTTP | Endpoint | Uso |
| :--- | :--- | :--- |
| GET | `/productos` | Listar con paginación y búsqueda |
| POST | `/productos` | Crear producto |
| PATCH | `/productos/:id` | Actualizar producto |
| DELETE | `/productos/:id` | Eliminar producto |
| GET | `/proveedores` | Cargar lista de proveedores para el formulario |

---

## Alta compleja de producto

La página soporta el caso de uso de alta compleja del catálogo:

- creación del `Producto` maestro;
- selección opcional de `alergenos`;
- asociación opcional de múltiples `proveedores` con precio y marca específica;
- reutilización del mismo modal para completar el flujo con edición posterior.

### Comportamiento esperado del formulario

1. El usuario rellena los datos base del producto.
2. Puede añadir alérgenos mediante el selector especializado.
3. Puede añadir una o varias relaciones proveedor-producto en el mismo modal.
4. El frontend envía un único payload a `POST /productos`.
5. Si el producto ya existe y se edita, el frontend usa `PATCH /productos/:id` para sincronizar relaciones.

### Reglas visibles para el usuario

- `unidad` es obligatoria.
- `contenido` debe ser mayor o igual a 0.
- Los alérgenos deben pertenecer al enum oficial.
- Cada proveedor solo puede aparecer una vez en el payload.
- En alta compleja, cada proveedor debe llevar `precioUnitario`.

> Ver detalle técnico del caso de uso en [Alta compleja de producto](../../modules/producto/alta-compleja-producto-maestro-proveedores.md).

---

## Relación con otros componentes

- [`DataTable`](../componentes/DataTable.md) — tabla/mosaico con cabecera de controles y paginación.
- [`ProductFilters`](../componentes/ProductFilters.md) — filtro de categorías en la barra de búsqueda.
- [`ProductCard`](../componentes/ProductCard.md) — tarjeta para el modo cuadrícula.
- [`DynamicFormModal`](../componentes/DynamicFormModal.md) — formulario de creación/edición.
- [`DetailModal`](../componentes/DetailModal.md) — vista de detalle del producto.
- [`ConfirmDialog`](../componentes/ConfirmDialog.md) — confirmación de borrado.
- [`StatusChip`](../componentes/StatusChip.md) — badge de categoría en la tabla.

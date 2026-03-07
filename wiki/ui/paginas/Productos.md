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
├── TextField (búsqueda)                    Busca por nombre, marca, código de barras
├── ProductFilters                          Autocomplete multi-select por categoría
├── DataTable <Producto>                    Tabla/mosaico con paginación integrada
│   ├── rightHeaderAction → Button          "Nuevo Producto" (escritorio) / IconButton (móvil)
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

## Barra de búsqueda y filtros

La barra se compone de dos controles en línea (`flexWrap`):

1. **`TextField` de búsqueda** — `minWidth: 360px`, `flex: 1 1 360px`. Dispara recarga al backend en cada keystroke (resetea a página 1).
2. **`ProductFilters`** — Autocomplete de categorías. Crece dinámicamente. Las categorías seleccionadas aparecen como chips con icono dentro del control.

> No hay una fila secundaria de chips externos. Los chips de selección viven **dentro** del Autocomplete.

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

| ID | Etiqueta | Render personalizado | Oculto en móvil |
| :--- | :--- | :--- | :---: |
| `nombre` | Nombre | — | — |
| `marca` | Marca | `row.marca ?? '—'` | ✅ |
| `tipo` | Tipo | `<StatusChip status={row.tipo} />` | ✅ |
| `contenido` | Contenido | `${contenido} ${unidad}` | — |
| `codigoBarras` | Cód. Barras | `row.codigoBarras ?? '—'` | ✅ |

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

## Relación con otros componentes

- [`DataTable`](../componentes/DataTable.md) — tabla/mosaico con cabecera de controles y paginación.
- [`ProductFilters`](../componentes/ProductFilters.md) — filtro de categorías en la barra de búsqueda.
- [`ProductCard`](../componentes/ProductCard.md) — tarjeta para el modo cuadrícula.
- [`DynamicFormModal`](../componentes/DynamicFormModal.md) — formulario de creación/edición.
- [`DetailModal`](../componentes/DetailModal.md) — vista de detalle del producto.
- [`ConfirmDialog`](../componentes/ConfirmDialog.md) — confirmación de borrado.
- [`StatusChip`](../componentes/StatusChip.md) — badge de categoría en la tabla.

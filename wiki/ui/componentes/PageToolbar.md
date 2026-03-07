# PageToolbar

El componente `PageToolbar` es el encabezado unificado para las páginas de gestión de datos. Proporciona una interfaz coherente para el título de la página, la búsqueda, los filtros, los controles de vista y las acciones principales.

## Características

- **Diseño Premium**: Fondo con desenfoque (backdrop-filter) y bordes sutiles.
- **Sticky**: Se mantiene fijo en la parte superior al hacer scroll para facilitar el acceso a los controles.
- **Responsivo**: Adaptación automática para dispositivos móviles, tabletas y escritorio.
- **Integración de Filtros**: Espacio dedicado para componentes de filtrado complejos (como `ProductFilters`).
- **Controles de Tabla**: Integración de cambio de vista (Lista/Cuadrícula), selector de tamaño de página y contador total de elementos.

## Propiedades (Props)

| Propiedad | Tipo | Descripción |
| :--- | :--- | :--- |
| `title` | `string` | Título principal de la sección. |
| `searchValue` | `string` | Valor actual del campo de búsqueda. |
| `onSearchChange` | `(value: string) => void` | Callback invocado al cambiar el texto de búsqueda. |
| `searchPlaceholder` | `string` | Texto de ayuda para el input de búsqueda (por defecto "Buscar..."). |
| `searchId` | `string` | Identificador único para el input de búsqueda. |
| `primaryAction` | `{ label: string, onClick: () => void, icon?: ReactNode, id?: string, disabled?: boolean }` | Configuración del botón principal (ej: "Nuevo Producto"). |
| `filters` | `ReactNode` | Nodo con los componentes de filtrado adicionales. |
| `totalItems` | `number` | Conteo total de elementos en la lista/tabla. |
| `totalItemsLabel` | `string` | Etiqueta para el conteo (ej: "productos"). |
| `viewMode` | `'list' \| 'grid'` | Modo de vista activo. |
| `onViewModeChange` | `(mode: 'list' \| 'grid') => void` | Callback para cambiar el modo de vista. |
| `pageSize` | `number` | Registros por página actuales. |
| `onPageSizeChange` | `(event: SelectChangeEvent<number>) => void` | Callback para cambiar el tamaño de página. |
| `pageSizeOptions` | `number[]` | Opciones disponibles para el tamaño de página (por defecto `[5, 10, 25, 50]`). |
| `sticky` | `boolean` | Determina si el toolbar es pegajoso (por defecto `true`). |

## Implementación Responsiva

- **Escritorio**: Diseño en varias filas con elementos alineados horizontalmente. Los filtros crecen dinámicamente hacia la izquierda.
- **Móvil/Tablet**: Los elementos se apilan verticalmente. El botón de acción principal se convierte en un botón circular flotante (FAB) para ahorrar espacio si es necesario o mantiene su posición según el layout.
- **Wrapping**: Si los filtros no caben al lado del buscador, pasan a ocupar el 100% del ancho debajo del mismo.

## Ejemplo de Uso

```tsx
<PageToolbar
    title="Gestión de Productos"
    searchValue={searchTerm}
    onSearchChange={setSearchTerm}
    totalItems={totalItems}
    totalItemsLabel="productos"
    primaryAction={{
        label: 'Nuevo Producto',
        onClick: () => setIsModalOpen(true),
    }}
    viewMode={viewMode}
    onViewModeChange={setViewMode}
    filters={<ProductFilters filters={filters} onChange={setFilters} />}
/>
```

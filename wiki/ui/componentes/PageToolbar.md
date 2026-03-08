# PageToolbar

El componente `PageToolbar` es el encabezado unificado para las páginas de gestión de datos. Proporciona una interfaz coherente para el título de la página, la búsqueda, los filtros, los controles de vista y las acciones principales.

## Características

- **Diseño Premium**: Fondo con desenfoque (backdrop-filter) y bordes sutiles.
- **Sticky**: Se mantiene fijo en la parte superior al hacer scroll para facilitar el acceso a los controles.
- **Responsivo**: Adaptación automática para dispositivos móviles, tabletas y escritorio.
- **Integración de Filtros**: Espacio dedicado para componentes de filtrado complejos (como `ProductFilters`).
- **Configuración de Tabla**: Integración de cambio de vista (Lista/Cuadrícula), selector de tamaño de página y un **Chip de Conteo Total** reubicado en la fila del título para mayor visibilidad.

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
| `totalItems` | `number` | Conteo total de elementos. Se muestra como un Chip de color `success` en la fila del título. |
| `totalItemsLabel` | `string` | Sufijo para el chip de conteo (ej: "registrados"). El chip mostrará "[X] [sufijo]". |
| `viewMode` | `'list' \| 'grid'` | Modo de vista activo. |
| `onViewModeChange` | `(mode: 'list' \| 'grid') => void` | Callback para cambiar el modo de vista. |
| `pageSize` | `number` | Registros por página actuales. |
| `onPageSizeChange` | `(event: SelectChangeEvent<number>) => void` | Callback para cambiar el tamaño de página. |
| `pageSizeOptions` | `number[]` | Opciones disponibles para el tamaño de página (por defecto `[5, 10, 25, 50]`). |
| `sticky` | `boolean` | Determina si el toolbar es pegajoso (por defecto `true`). |

## Implementación Responsiva

- **Escritorio**: Diseño en tres niveles. El título y el **Chip de Conteo** comparten la primera fila. Los filtros crecen dinámicamente hacia la izquierda en la segunda fila.
- **Móvil/Tablet**: El Chip de conteo se compacta (solo número) en móviles para ahorrar espacio. Los elementos de búsqueda y filtros se apilan verticalmente ocupando el 100% del ancho.
- **Alineación**: El botón de acción principal y el conteo total están optimizados para mantenerse en la misma línea siempre que sea posible en el layout inferior.

## Ejemplo de Uso

```tsx
<PageToolbar
    title="Gestión de Productos"
    searchValue={searchTerm}
    onSearchChange={setSearchTerm}
    totalItems={totalItems}
    totalItemsLabel="productos registrados"
    primaryAction={{
        label: 'Nuevo Producto',
        onClick: () => setIsModalOpen(true),
    }}
    viewMode={viewMode}
    onViewModeChange={setViewMode}
    filters={<ProductFilters filters={filters} onChange={setFilters} />}
/>
```

# PageToolbar

El componente `PageToolbar` es el encabezado unificado para las páginas de gestión de datos. Proporciona una interfaz coherente para el título de la página, la búsqueda, los filtros, los controles de vista y las acciones principales.

## Características

- **Diseño Ultra-Compacto (v3)**: Estructura de tres filas optimizada para densidad de información sin saturación visual.
- **Micro-Interacciones**: Botón de colapso minimalista (flecha inferior) para expandir o contraer la zona de búsqueda y filtros.
- **Layout Responsivo 50/50**: En resoluciones de Tablet y Escritorio, el buscador y el componente de filtros ocupan exactamente el 50% de la fila, garantizando una alineación simétrica perfecta.
- **Adaptativo a Móvil**: Los inputs crecen al 100% en pantallas pequeñas, apilándose verticalmente para maximizar la usabilidad táctil.
- **Acciones dinámicas**: Los botones de acción (`Exportar`, `Nuevo`) se reducen automáticamente a iconos con Tooltip en dispositivos móviles y tablets para ahorrar espacio vertical.

## Propiedades (Props)

| Propiedad | Tipo | Descripción |
| :--- | :--- | :--- |
| `title` | `string` | Título principal de la sección. |
| `searchValue` | `string` | Valor actual del campo de búsqueda. |
| `onSearchChange` | `(value: string) => void` | Callback invocado al cambiar el texto de búsqueda. |
| `filters` | `ReactNode` | Nodo con los componentes de filtrado adicionales (ej: `ProductFilters`). |
| `totalItems` | `number` | Conteo total que se muestra en un Chip de éxito junto al título. |

## Estructura del Layout

1. **Fila 1 (Cabecera)**: Título y Chip de Conteo Total. Proporciona contexto inmediato.
2. **Fila 2 (Controles)**: Buscador principal y Filtros inteligentes (SmartFilters) en una disposición 50/50 simétrica.
3. **Fila 3 (Acciones)**: Botones de exportación, creación y selector de vista/paginación.
4. **Base**: Botón de colapso para reducir la altura del Toolbar a solo la Cabecera + Acciones.

## Implementación de Filtros
El espacio de filtros (`filters`) está diseñado- **Carga Diferida de Filtros Avanzados**: Los selectores complejos (ej: `SmartFilterAutocomplete`) se cargan mediante `React.lazy` para no penalizar el tiempo de carga inicial de la página (LCP).
- **Navegación Rápida (`F3`) ✅**: El área de filtros es un objetivo de salto global accesible mediante la tecla de función F3, permitiendo al usuario volver a la búsqueda instantáneamente desde cualquier punto de la página.

## Navegación por Teclado e Interacción

El `PageToolbar` actúa como un Landmark de búsqueda y filtrado:
1.  **Salto a Filtros (`F3`)**: Al pulsar F3, el foco se desplaza al contenedor de filtros (`#filters-area`).
2.  **Foco Inteligente**: El contenedor de filtros tiene un estilo de resalte visual cuando está activo, confirmando al usuario que puede empezar a escribir o navegar entre categorías.
3.  **Accesibilidad en Controles**: Todos los campos de búsqueda y selectores tienen etiquetas descriptivas para lectores de pantalla.
ageToolbar` nunca cambie su altura vertical independientemente de la selección. 📏✅

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

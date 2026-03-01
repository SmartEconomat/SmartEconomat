# Componente visual funcional: ProductFilters

El componente `ProductFilters` abstrae la interfaz de selección de filtros de búsqueda específicos de entidad, agrupando menús desplegables (`Select`), y botones de limpieza de estado. Está estrechamente acoplado al módulo de productos de la aplicación.

## Propósito

Encapsular los controles condicionales que filtran las listas de productos (como Categoría, Alérgenos y otras opciones) del resto del Layout.
- Facilita un diseño flexbox *inline* o en pila (`stack`), colapsando y expandiendo condicionalmente su ancho en pantallas móviles a través del enfoque (focus / expanded).
- Maneja un estado local y emite las actualizaciones al componente padre sólo cuando el usuario interactúa activamente con las opciones de selección.

## Estado de Filtros (`ProductFiltersState`)

El componente opera sobre un objeto de estado exportado como interfaz:

| Propiedad | Tipo | Descripción |
| :--- | :--- | :--- |
| `categorias` | `string[]` | Un array de los identificadores (`values`) de las categorías que el usuario desea ver en la tabla (comúnmente ligado a `CategoriaProducto`). |
| `alergenos` | `string[]` | Un array de string enumerando los alérgenos presentes para filtrar la selección de productos (actualmente deshabilitado visualmente para refinar UX). |

## Props Principales (`ProductFiltersProps`)

| Propiedad | Tipo | Descripción |
| :--- | :--- | :--- |
| `filters` | `ProductFiltersState` | Recibe el estado actual (proveniente del padre) con los arrays de las opciones marcadas. |
| `onChange` | `(filters: ProductFiltersState) => void` | Evento que propaga una nueva versión de `filters` cada vez que el usuario marca o desmarca checks de los `Selector` incrustados. |
| `onClear` | `() => void` | Callback dedicado para vaciar masivamente *todos* los filtros activos y volver a un listado neutro (`filters.categorias` vacío, etc). Disparado por el botón "Limpiar". |
| `inline` | `boolean` | (Opcional) Directriz de _layout_. Si es `true`, dispondrá sus selectores lado a lado (Row) de manera adaptable usando una anchura calculada y min-widths elásticos en lugar de una pila block. |

## Ejemplo de uso e Integración

Comúnmente se renderiza en conjunto con un campo `Search` de Material UI antes de instanciar la `DataTable` que dibuja el cuerpo final.

```tsx
import { ProductFilters, ProductFiltersState } from '@/features/productos/ProductFilters';

// ...
const [filters, setFilters] = useState<ProductFiltersState>({ categorias: [], alergenos: [] });

// Limpia todo
const handleClearFilters = () => {
    setFilters({ categorias: [], alergenos: [] });
};

<ProductFilters
    filters={filters}
    onChange={setFilters}
    onClear={handleClearFilters}
    inline={true} // Se comportará de forma elástica, colapsando y expandiéndose en focus (UX Móvil).
/>
```

# Componente funcional: ProductFilters

> **Ubicación:** `src/features/productos/ProductFilters.tsx`  
> **Última actualización:** 2026-03-07

---

## Propósito

El componente `ProductFilters` es una implementación especializada del componente atómico `SmartFilterAutocomplete` para el módulo de productos. Permite filtrar el catálogo por categorías de forma rápida y visualmente rica.

## Evolución Tecnológica (v3) ✅

Este componente ha sido refactorizado para utilizar el **SmartFilterAutocomplete** global, lo que le otorga automáticamente:
- **Scroll Horizontal Infinito**: Las categorías seleccionadas no ocupan espacio vertical.
- **Degradado Inteligente**: Indica visualmente si hay más filtros ocultos por scroll.
- **Búsqueda-Primero**: El cursor se posiciona a la izquierda para una búsqueda inmediata.
- **Reactividad**: Scroll automático al final al añadir nuevas categorías.

## Accesibilidad (WAVE Ready) ✅

- **Etiquetado Robusto**: El componente de entrada utiliza el patrón `slotProps.htmlInput` para asignar un `aria-label` descriptivo vinculable por lectores de pantalla.
- **Tipografía**: Los Chips de categorías utilizan un tamaño de fuente de **0.8rem (12.8px)** para superar los umbrales de legibilidad de auditoría externa.

Los iconos de cada categoría son los mismos que utiliza `StatusChip` — provienen de `getCategoryIconFilled`.

> **Sin filtro de alérgenos:** el campo `alergenos` de `ProductFiltersState` se mantiene por compatibilidad pero no genera ningún control visual en este componente.

---

## Estado de Filtros (`ProductFiltersState`)

```ts
export interface ProductFiltersState {
    categorias: CategoriaProducto[];  // filtro activo
    alergenos:  string[];             // mantenido por compatibilidad, sin UI
}
```

---

## Props (`ProductFiltersProps`)

| Propiedad | Tipo | Obligatorio | Descripción |
| :--- | :--- | :---: | :--- |
| `filters` | `ProductFiltersState` | Sí | Estado actual de filtros procedente del padre. |
| `onChange` | `(filters: ProductFiltersState) => void` | Sí | Callback que recibe el estado actualizado al marcar/desmarcar una categoría. |
| `onClear` | `() => void` | — | Callback para limpiar todos los filtros (no genera botón interno; la limpieza la gestiona el padre). |
| `inline` | `boolean` | — | Mantenida por compatibilidad. No tiene efecto visual en la versión actual. |

---

## Comportamiento del Autocomplete

| Interacción | Resultado |
| :--- | :--- |
| Escribir en el input | Filtra la lista de categorías en tiempo real |
| Hacer clic en una opción del dropdown | La añade como chip al input; el dropdown permanece abierto (`disableCloseOnSelect`) |
| Hacer clic en la ✕ de un chip | Elimina esa categoría del filtro |
| Hacer clic en el botón ✕ general del Autocomplete | Limpia todas las categorías |
| Número de categorías seleccionadas | El ancho crece: `min(220 + n×110, 660) px` con transición CSS |

---

## Iconos de categoría

Cada categoría tiene un icono único asignado en `getCategoryIconFilled` (mismo helper que usa `StatusChip`):

| Categoría | Icono MUI |
| :--- | :--- |
| Verdura | `GrassIcon` |
| Fruta | `AppleIcon` |
| Carne | `LunchDiningIcon` |
| Pescado | `SetMealIcon` |
| Marisco | `RiceBowlIcon` |
| Lácteo | `LocalDrinkIcon` |
| Huevo | `EggIcon` |
| Cereal | `GrainIcon` |
| Legumbre | `SpaIcon` |
| Fruto Seco | `EnergySavingsLeafIcon` |
| Condimento | `KitchenIcon` |
| Aceite | `OpacityIcon` |
| Azúcar | `IcecreamIcon` |
| Bebida | `LocalBarIcon` |
| Otro | `CategoryIcon` |

---

## Ejemplo de uso

```tsx
import ProductFilters, { ProductFiltersState } from '@/features/productos/ProductFilters';

const [filters, setFilters] = useState<ProductFiltersState>({ categorias: [], alergenos: [] });

<ProductFilters
    filters={filters}
    onChange={(newFilters) => {
        setFilters(newFilters);
        setPage(1);
    }}
    onClear={() => {
        setFilters({ categorias: [], alergenos: [] });
        setPage(1);
    }}
/>
```

---

## Dependencias internas

| Módulo | Uso |
| :--- | :--- |
| `./utils/getCategoryIconFilled` | Iconos filled por categoría en chips y opciones del dropdown |
| `../../services/producto.types` | Enum `CategoriaProducto` |
| `@mui/material/Autocomplete` | Control base con selección múltiple y búsqueda |

---

## Relación con otros componentes

- **`PageToolbar.tsx`** — el contenedor principal que aloja a `ProductFilters` y gestiona la disposición responsiva.
- **`Productos.tsx`** — utiliza `ProductFilters` a través de `PageToolbar`, gestiona el estado `filters` y lo pasa como prop.
- **`StatusChip`** — utiliza los mismos iconos via `getCategoryIconFilled` para mostrar el tipo de producto en las filas de la tabla.
- **`DataTable`** — se renderiza debajo de la barra de búsqueda + filtros.

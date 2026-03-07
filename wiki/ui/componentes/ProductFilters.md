# Componente funcional: ProductFilters

> **Ubicación:** `src/features/productos/ProductFilters.tsx`  
> **Última actualización:** 2026-03-07

---

## Propósito

`ProductFilters` encapsula el control de filtrado por **categorías de producto** dentro de la página de Productos.  
Implementa un **Autocomplete de MUI con selección múltiple** que combina:

- Búsqueda en tiempo real al escribir
- Dropdown desplegable para seleccionar categorías
- Opciones seleccionadas como **chips con icono oficial de categoría** dentro del propio control
- **Crecimiento dinámico del ancho**: El componente crece hacia la izquierda conforme se añaden categorías, permitiendo que el buscador se reduzca hasta un mínimo responsivo.
- **Responsividad Inteligente**: Si el buscador y los filtros no caben en la misma fila, los filtros pasan a ocupar el 100% del ancho debajo del buscador.
- Mismo alto que el campo de búsqueda (`size="small"` → 40 px)

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
| `filters` | `ProductFiltersState` | ✅ | Estado actual de filtros procedente del padre. |
| `onChange` | `(filters: ProductFiltersState) => void` | ✅ | Callback que recibe el estado actualizado al marcar/desmarcar una categoría. |
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

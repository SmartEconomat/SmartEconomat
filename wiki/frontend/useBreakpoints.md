# Hook: useBreakpoints

> **Ubicación:** `src/utils/useBreakpoints.ts`  
> **Última actualización:** 2026-03-07

---

## Propósito

Hook centralizado que expone los **breakpoints responsivos** del proyecto como flags booleanos.  
**Todos los componentes del proyecto DEBEN usar este hook** en lugar de llamar a `useMediaQuery` directamente, garantizando así consistencia total en los puntos de corte.

> [!IMPORTANT]
> Solo importar `useBreakpoints`. Nunca usar `useMediaQuery(theme.breakpoints.down('sm'))` de forma directa en un componente.

---

## Tabla de breakpoints del proyecto

| Token | Rango exacto | Dispositivos típicos |
| :--- | :--- | :--- |
| `xs` — **mobile** | 0 – 599 px | Móviles en vertical |
| `sm` — **tablet** | 600 – 899 px | Móviles horizontal / tablets pequeñas |
| `md` — **desktop** | 900 – 1199 px | Tablets grandes / portátiles |
| `lg` — **large** | 1200 – 1535 px | Monitores estándar |
| `xl` — **xlarge** | ≥ 1536 px | Pantallas grandes / 4K |

---

## Flags disponibles

### Puntos de corte exactos (solo uno activo a la vez)

| Flag | Descripción |
| :--- | :--- |
| `isMobile` | `true` en xs (0–599 px) |
| `isTablet` | `true` en sm (600–899 px) |
| `isDesktop` | `true` en md (900–1199 px) |
| `isLargeDesktop` | `true` en lg (1200–1535 px) |
| `isXLarge` | `true` en xl (≥ 1536 px) |

### Rangos compuestos (los más usados)

| Flag | Rango | Útil para… |
| :--- | :--- | :--- |
| `isMobileOrTablet` | < 900 px | Layouts de una columna, navbars colapsables |
| `isTabletOrAbove` | ≥ 600 px | Mostrar columnas adicionales en tabla |
| `isTabletOrBelow` | < 1200 px | Ocultar sidebars secundarios |
| `isDesktopOrAbove` | ≥ 900 px | Paneles laterales, layouts avanzados |

### Utilidad numérica

| Flag | Descripción |
| :--- | :--- |
| `screenWidth` | Anchura actual del viewport en píxeles (`window.innerWidth`) |

---

## Uso básico

```tsx
import { useBreakpoints } from '@/utils/useBreakpoints';

const MyComponent = () => {
    const { isMobile, isDesktop, isMobileOrTablet } = useBreakpoints();

    return (
        <Box sx={{ flexDirection: isMobileOrTablet ? 'column' : 'row' }}>
            {isMobile ? <CompactView /> : <FullView />}
        </Box>
    );
};
```

---

## Patrones de uso habituales en el proyecto

### 1. Botón texto → icono en móvil

```tsx
const { isMobile } = useBreakpoints();

{isMobile ? (
    <IconButton onClick={handleNew}><AddIcon /></IconButton>
) : (
    <Button variant="contained" startIcon={<AddIcon />}>Nuevo</Button>
)}
```

### 2. Barra de búsqueda adaptable

```tsx
const { isMobileOrTablet } = useBreakpoints();

<Box sx={{
    display: 'flex',
    flexDirection: isMobileOrTablet ? 'column' : 'row',
    gap: 1.5,
}}>
    <TextField sx={{ width: isMobileOrTablet ? '100%' : 'auto', minWidth: 360 }} />
    <ProductFilters ... />
</Box>
```

### 3. Columnas de tabla ocultas en móvil

```tsx
const { isMobile } = useBreakpoints();

const columns = [
    { id: 'nombre', label: 'Nombre' },
    // oculta en móvil: filtradas antes de pasar a DataTable
    ...(!isMobile ? [
        { id: 'marca',   label: 'Marca' },
        { id: 'tipo',    label: 'Tipo'  },
    ] : []),
];
```

### 4. Sidebar colapsable

```tsx
const { isMobile } = useBreakpoints();
const [open, setOpen] = useState(!isMobile); // cerrado por defecto en móvil
```

---

## Relación con el sistema de temas

`useBreakpoints` consume el tema MUI activo vía `useTheme()`, por lo que es compatible con todos los temas del proyecto (`light`, `dark`, `highContrastLight`, `highContrastDark`). Los valores de breakpoint son los mismos independientemente del tema.

---

## Componentes que ya usan este hook

| Componente | Flags usados |
| :--- | :--- |
| `MainLayout.tsx` | `isMobile` — drawer temporal vs permanente |
| `Productos.tsx` | `isMobile`, `isMobileOrTablet` — botón, barra de búsqueda |
| `ProductFilters.tsx` | `isMobileOrTablet` — ancho del Autocomplete |

---

## ❌ Anti-patrones a evitar

```tsx
// ❌ MAL: llama useMediaQuery directamente
import { useMediaQuery } from '@mui/material';
const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

// ✅ BIEN: usa el hook centralizado
import { useBreakpoints } from '@/utils/useBreakpoints';
const { isMobile } = useBreakpoints();
```

```tsx
// ❌ MAL: breakpoints en sx con tokens sx en vez de lógica JS
sx={{ display: { xs: 'none', sm: 'block' } }}

// ✅ BIEN: lógica clara con el hook
{!isMobile && <Component />}
// o si es puramente visual (sin lógica JS asociada):
sx={{ display: { xs: 'none', sm: 'block' } }}  // aceptable para casos simples
```

> [!TIP]
> Para casos puramente visuales (hide/show con CSS), `sx={{ display: { xs: 'none', sm: 'block' } }}` sigue siendo válido. Usa el hook cuando necesites lógica condicional en JS (renderizado condicional, cálculos de ancho, cambio de layout).

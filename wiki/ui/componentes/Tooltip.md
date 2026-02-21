# Documentación de Componente: Tooltip

**Tipo:** UI (User Interface)
**Ubicación:** `src/components/ui/Tooltip.tsx`

## Descripción General
Componente reutilizable que estandariza los tooltips en toda la aplicación. Extiende el `Tooltip` de Material UI preconfigurando animaciones y estilos para mantener la consistencia visual.

## Props Extendidas

Además de las props de `MuiTooltip`, incluye:

-   **`describeChild`** (`boolean`):
    -   Si es `true`, clona el elemento hijo y le añade `aria-label` con el texto del tooltip.
    -   Crucial para accesibilidad cuando el elemento hijo es solo un icono y no tiene texto visible (ej: Sidebar colapsado).

## Integración con Modo Aprendizaje

El componente está diseñado para trabajar junto con el contexto `isLearningMode`.

-   **Modo Normal:** Muestra tooltips concisos (ej: "Inicio").
-   **Modo Aprendizaje:** Muestra descripciones detalladas (ej: "Panel principal con resumen de actividad...").

### Ejemplo de Uso Completo

```tsx
import { Tooltip } from '../components/ui/Tooltip';
import { getTooltipContent } from '../utils/tooltipUtils';

// En un componente conectado al contexto
const content = getTooltipContent(isOpen, isLearningMode, "Título", "Descripción larga...");

<Tooltip title={content} describeChild>
    <IconButton>
        <Icon />
    </IconButton>
</Tooltip>
```

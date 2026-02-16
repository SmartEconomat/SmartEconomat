# Documentación de Componente: Tooltip

**Tipo:** UI (User Interface)
**Ubicación:** `src/components/ui/Tooltip.tsx`

## Descripción General
Componente reutilizable que estandariza los tooltips en toda la aplicación. Extiende el `Tooltip` de Material UI preconfigurando animaciones y estilos para mantener la consistencia visual.

<<<<<<< HEAD
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
=======
## Props
Acepta todas las props de `MuiTooltip`.

-   **Defaults:**
    -   `TransitionComponent`: `Zoom` (Animación de zoom al aparecer).
    -   `arrow`: `true` (Muestra una flecha señalando al elemento).
    -   `placement`: `'right'` (Se posiciona a la derecha del elemento por defecto, sobrescribible).

## Ejemplo de Uso

```tsx
import { Tooltip } from '../components/ui/Tooltip';

<Tooltip title="Descripción de la acción">
>>>>>>> 40a2733 (fix:modificación final de componentes y estados globales de la aplicación, creación de tooltips para descripciones guiadas)
    <IconButton>
        <Icon />
    </IconButton>
</Tooltip>
```

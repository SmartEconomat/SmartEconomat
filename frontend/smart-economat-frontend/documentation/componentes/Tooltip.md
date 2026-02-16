# Documentación de Componente: Tooltip

**Tipo:** UI (User Interface)
**Ubicación:** `src/components/ui/Tooltip.tsx`

## Descripción General
Componente reutilizable que estandariza los tooltips en toda la aplicación. Extiende el `Tooltip` de Material UI preconfigurando animaciones y estilos para mantener la consistencia visual.

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
    <IconButton>
        <Icon />
    </IconButton>
</Tooltip>
```

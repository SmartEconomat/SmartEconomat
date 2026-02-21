import React from 'react';
import { Tooltip as MuiTooltip, TooltipProps, Zoom } from '@mui/material';

/**
 * Componente Tooltip estandarizado para la aplicación.
 * Incluye por defecto la animación Zoom, flecha y posición a la derecha.
 */
export const Tooltip = (props: TooltipProps) => {
    return (
        <MuiTooltip
            TransitionComponent={Zoom}
            arrow
            placement="right"
            {...props}
        />
    );
};

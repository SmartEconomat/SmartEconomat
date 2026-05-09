import React from 'react';
import { SvgIcon, SvgIconProps } from '@mui/material';

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
const BarcodeIcon: React.FC<SvgIconProps> = (props) => (
  <SvgIcon {...props}>
    <path d="M2 4h2v16H2V4zm4 0h1v16H6V4zm3 0h3v16H9V4zm5 0h2v16h-2V4zm3 0h1v16h-1V4zm3 0h2v16h-2V4z" />
  </SvgIcon>
);

export default BarcodeIcon;

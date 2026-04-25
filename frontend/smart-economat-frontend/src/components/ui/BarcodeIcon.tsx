import React from 'react';
import { SvgIcon, SvgIconProps } from '@mui/material';

/**
 * Inline SVG barcode icon wrapped in MUI's {@link SvgIcon}.
 *
 * Accepts all standard {@link SvgIconProps} (color, fontSize, sx, etc.) so it
 * integrates seamlessly as a button `startIcon` or standalone decorative element.
 *
 * @param props - Standard MUI {@link SvgIconProps}.
 * @returns An SVG barcode glyph inside an MUI SvgIcon container.
 * @example
 * <BarcodeIcon color="primary" fontSize="large" />
 */
const BarcodeIcon: React.FC<SvgIconProps> = (props) => (
  <SvgIcon {...props}>
    <path d="M2 4h2v16H2V4zm4 0h1v16H6V4zm3 0h3v16H9V4zm5 0h2v16h-2V4zm3 0h1v16h-1V4zm3 0h2v16h-2V4z" />
  </SvgIcon>
);

export default BarcodeIcon;

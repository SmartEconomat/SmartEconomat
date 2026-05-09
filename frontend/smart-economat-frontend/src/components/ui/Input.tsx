import React from 'react';
import { TextField, TextFieldProps } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
type InputProps = TextFieldProps & {
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  label: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  name: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  type?: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  value?: unknown;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  onChange?: React.ChangeEventHandler<HTMLTextAreaElement | HTMLInputElement>;
};

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
/** Oculta el control nativo de revelar contraseña (Edge/Chromium en Windows) para no duplicar el icono de MUI. */
const hideNativePasswordRevealSx: SxProps<Theme> = {
  '& input[type="password"]::-ms-reveal': { display: 'none' },
  '& input[type="password"]::-ms-clear': { display: 'none' },
  '& input[type="password"]::-webkit-textfield-decoration-container': {
    display: 'none',
  },
};

const Input: React.FC<InputProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  required = false,
  sx,
  InputProps,
  ...props
}) => {
  const autoComplete = props.autoComplete ?? undefined;

  /** Solo si ya hay icono propio: el navegador añadiría un segundo control nativo. */
  const suppressNativePasswordReveal =
    type === 'password' && Boolean(InputProps?.endAdornment);

  const mergedSx: SxProps<Theme> | undefined = suppressNativePasswordReveal
    ? [
        hideNativePasswordRevealSx,
        ...(sx == null ? [] : Array.isArray(sx) ? sx : [sx]),
      ]
    : sx;

  return (
    <TextField
      margin="normal"
      required={required}
      fullWidth
      id={name}
      label={label}
      name={name}
      type={type}
      autoComplete={autoComplete}
      value={value}
      onChange={onChange}
      slotProps={{
        inputLabel: {
          shrink: true,
        },
      }}
      InputProps={InputProps}
      sx={mergedSx}
      {...props}
    />
  );
};

export default Input;

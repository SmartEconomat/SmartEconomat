import React from 'react';
import { TextField, TextFieldProps } from '@mui/material';

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
export type InputFieldProps = Omit<TextFieldProps, 'id' | 'label'> & {
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  id: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  label: string;
};

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
const InputField: React.FC<InputFieldProps> = ({ id, label, ...props }) => {
  return (
    <TextField
      id={id}
      label={label}
      {...props}
      inputProps={{
        ...props.inputProps,
        'aria-label': label,
      }}
    />
  );
};

export default InputField;

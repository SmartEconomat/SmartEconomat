import React from 'react';
import { TextField, TextFieldProps, MenuItem } from '@mui/material';

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
export type SelectOption = {
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  value: string | number;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  label: string | React.ReactNode;
};

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
export type SelectFieldProps = Omit<TextFieldProps, 'select' | 'children'> & {
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  options: SelectOption[];
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
const SelectField: React.FC<SelectFieldProps> = ({
  options,
  id,
  label,
  ...props
}) => {
  return (
    <TextField
      select
      id={id}
      label={label}
      {...props}
      SelectProps={{
        ...props.SelectProps,
        inputProps: {
          ...props.SelectProps?.inputProps,
          id: `${id}-input`,
          'aria-label': label,
        },
      }}
    >
      {options.map((option) => (
        <MenuItem key={String(option.value)} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  );
};

export default SelectField;

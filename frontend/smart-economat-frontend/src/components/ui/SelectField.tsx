import React from 'react';
import { TextField, TextFieldProps, MenuItem } from '@mui/material';

/**
 * Documentación en español.
 */
export type SelectOption = {
  /**
   * Documentación en español.
   */
  value: string | number;
  /**
   * Documentación en español.
   */
  label: string | React.ReactNode;
};

/**
 * Documentación en español.
 */
export type SelectFieldProps = Omit<TextFieldProps, 'select' | 'children'> & {
  /**
   * Documentación en español.
   */
  options: SelectOption[];
  /**
   * Documentación en español.
   */
  id: string;
  /**
   * Documentación en español.
   */
  label: string;
};

/**
 * Documentación en español.
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

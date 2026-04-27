import React from 'react';
import { TextField, TextFieldProps } from '@mui/material';

/**
 * Documentación en español.
 */
export type InputFieldProps = Omit<TextFieldProps, 'id' | 'label'> & {
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

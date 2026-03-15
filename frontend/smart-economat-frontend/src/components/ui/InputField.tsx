import React from 'react';
import { TextField, TextFieldProps } from '@mui/material';

export type InputFieldProps = Omit<TextFieldProps, 'id' | 'label'> & {
  id: string;
  label: string;
};

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

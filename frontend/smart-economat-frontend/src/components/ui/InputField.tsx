import React from 'react';
import { TextField, TextFieldProps } from '@mui/material';

/**
 * Props for the {@link InputField} component.
 * `id` and `label` are required to guarantee proper accessibility.
 */
export type InputFieldProps = Omit<TextFieldProps, 'id' | 'label'> & {
  /** HTML element ID — also used as the ARIA label target. */
  id: string;
  /** Visible label text for the field (also injected as `aria-label`). */
  label: string;
};

/**
 * Accessible wrapper for MUI's `TextField`.
 *
 * Injects `aria-label` on the underlying `<input>` element so that screen
 * readers announce the label even when the floating label is not visible
 * (e.g. when the field is pre-filled or the label is visually hidden).
 *
 * @param props - See {@link InputFieldProps}.
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

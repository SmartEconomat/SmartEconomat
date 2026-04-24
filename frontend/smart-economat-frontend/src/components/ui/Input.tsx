import React from 'react';
import { TextField, TextFieldProps } from '@mui/material';

/**
 * Extended props for the {@link Input} component.
 */
type InputProps = TextFieldProps & {
  /** Visible label for the text field. */
  label: string;
  /** HTML `name` attribute — also used as the element `id`. */
  name: string;
  /** HTML input type. Defaults to `'text'`. */
  type?: string;
  /** Current value of the input. */
  value?: unknown;
  /** Change event handler. */
  onChange?: React.ChangeEventHandler<HTMLTextAreaElement | HTMLInputElement>;
};

/**
 * Thin wrapper around MUI's `TextField` that enforces `label` and `name`
 * as required props and sets sensible defaults (`margin="normal"`, `fullWidth`).
 *
 * All additional `TextFieldProps` are forwarded to the underlying `TextField`.
 *
 * @param props - See {@link InputProps}.
 */
const Input: React.FC<InputProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  required = false,
  ...props
}) => {
  const autoComplete = props.autoComplete ?? undefined;

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
      {...props}
    />
  );
};

export default Input;

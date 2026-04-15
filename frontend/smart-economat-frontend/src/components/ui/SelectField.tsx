import React from 'react';
import { TextField, TextFieldProps, MenuItem } from '@mui/material';

/**
 * A single option displayed inside {@link SelectField}.
 */
export type SelectOption = {
  /** Underlying form value. */
  value: string | number;
  /** Human-readable label; accepts any React node for rich content. */
  label: string | React.ReactNode;
};

/**
 * Props for the {@link SelectField} component.
 * `id` and `label` are required to guarantee proper accessibility.
 */
export type SelectFieldProps = Omit<TextFieldProps, 'select' | 'children'> & {
  /** Menu options rendered as `MenuItem` elements. */
  options: SelectOption[];
  /** HTML element ID — also used as the ARIA label target. */
  id: string;
  /** Visible label text — also injected as `aria-label` on the native input. */
  label: string;
};

/**
 * Accessible MUI `TextField` select wrapper.
 *
 * Injects `aria-label` on the underlying native input element so that screen
 * readers announce the field label correctly, working around MUI's default
 * behaviour of relying solely on `InputLabel` for labelling.
 *
 * @param props - See {@link SelectFieldProps}.
 * @returns JSX element rendering an accessible MUI select field.
 * @example
 * <SelectField
 *   id="categoria"
 *   label="Categoría"
 *   options={[{ value: 'verdura', label: 'Verdura' }]}
 * />
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

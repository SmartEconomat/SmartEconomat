import React from 'react';
import {
  FormControl,
  InputLabel,
  Select as MuiSelect,
  MenuItem,
  FormHelperText,
  SelectProps as MuiSelectProps,
} from '@mui/material';

/**
 * A single option in the {@link Select} dropdown.
 */
export interface SelectOption {
  /** Underlying value submitted by the form. */
  value: string | number;
  /** Human-readable label shown in the menu item. */
  label: string;
}

/**
 * Props for the {@link Select} component.
 */
export type SelectProps = MuiSelectProps & {
  /** Visible field label. */
  label: string;
  /** HTML `name` attribute and the base for ARIA `labelledby`. */
  name: string;
  /** Menu options rendered as `MenuItem` elements. */
  options: SelectOption[];
  /** Optional helper / error text shown below the select. */
  helperText?: string;
};

/**
 * Controlled select field built on top of MUI's `Select` and `FormControl`.
 *
 * Handles both single and multi-select modes, normalises empty values, and
 * surfaces an optional helper text beneath the control.
 *
 * @param props - See {@link SelectProps}.
 * @returns JSX element rendering a labelled select inside a `FormControl`.
 * @example
 * <Select
 *   label="Estado"
 *   name="estado"
 *   options={[{ value: 'active', label: 'Activo' }]}
 * />
 */
const Select: React.FC<SelectProps> = ({
  label,
  name,
  options,
  helperText,
  error,
  required,
  fullWidth = true,
  margin = 'normal',
  value,
  onChange,
  ...props
}) => {
  const isValueEmpty = value === undefined || value === null || value === '';
  const formMargin =
    (margin as 'none' | 'normal' | 'dense' | undefined) || 'normal';

  const renderValue = () => {
    if (props.multiple) {
      return Array.isArray(value) ? value : [];
    }
    return isValueEmpty ? '' : value;
  };

  return (
    <FormControl
      fullWidth={fullWidth}
      margin={formMargin}
      error={error}
      required={required}
    >
      <InputLabel id={`${name}-label`}>{label}</InputLabel>
      <MuiSelect
        labelId={`${name}-label`}
        id={name}
        name={name}
        value={renderValue()}
        label={label}
        onChange={onChange}
        {...props}
      >
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </MuiSelect>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
};

export default Select;

import React from 'react';
import {
  FormControlLabel,
  Checkbox as MuiCheckbox,
  CheckboxProps as MuiCheckboxProps,
} from '@mui/material';

/**
 * Props for the {@link Checkbox} component.
 */
interface CheckboxProps extends MuiCheckboxProps {
  /** Visible label rendered next to the checkbox via `FormControlLabel`. */
  label: string;
}

/**
 * Labelled checkbox that wraps MUI's {@link MuiCheckbox} inside a
 * `FormControlLabel`.
 *
 * Colour defaults to `"primary"`. All other MUI `CheckboxProps` (e.g.
 * `checked`, `onChange`, `disabled`) are forwarded to the underlying checkbox.
 *
 * @param props - `label` plus any MUI `CheckboxProps`.
 * @returns A `FormControlLabel` containing an MUI `Checkbox`.
 * @example
 * <Checkbox label="Recordarme" checked={remember} onChange={handleChange} />
 */
const Checkbox: React.FC<CheckboxProps> = ({ label, ...props }) => {
  return (
    <FormControlLabel
      control={<MuiCheckbox color="primary" {...props} />}
      label={label}
      sx={{
        width: '100%',
        ml: -1,
        my: 0.5,
        p: 1,
        '& .MuiTypography-root': { fontSize: '0.94rem' },
        '&:hover': { bgcolor: 'rgba(0,0,0,0.04)', borderRadius: 1 },
      }}
    />
  );
};

export default Checkbox;

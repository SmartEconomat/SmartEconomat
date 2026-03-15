import React from 'react';
import {
  FormControlLabel,
  Checkbox as MuiCheckbox,
  CheckboxProps as MuiCheckboxProps,
} from '@mui/material';

interface CheckboxProps extends MuiCheckboxProps {
  label: string;
}

const Checkbox: React.FC<CheckboxProps> = ({ label, ...props }) => {
  return (
    <FormControlLabel
      control={<MuiCheckbox color="primary" {...props} />}
      label={label}
    />
  );
};

export default Checkbox;

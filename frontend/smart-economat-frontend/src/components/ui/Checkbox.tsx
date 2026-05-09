import React from 'react';
import {
  FormControlLabel,
  Checkbox as MuiCheckbox,
  CheckboxProps as MuiCheckboxProps,
} from '@mui/material';

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
interface CheckboxProps extends MuiCheckboxProps {
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  label: string;
}

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
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

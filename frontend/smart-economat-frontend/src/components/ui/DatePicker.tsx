import React from 'react';
import { DatePicker as MUIDatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { Box } from '@mui/material';

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
interface DatePickerProps {
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  label: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  value: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  onChange: (name: string, value: string) => void;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  name: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  required?: boolean;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  disabled?: boolean;
}

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onChange,
  name,
  required = false,
  disabled = false,
}) => {
  return (
    <Box sx={{ width: '100%', mt: 2, mb: 1 }}>
      <MUIDatePicker
        label={label}
        value={value ? dayjs(value) : null}
        onChange={(newValue) => {
          const formattedDate = newValue ? newValue.format('YYYY-MM-DD') : '';
          onChange(name, formattedDate);
        }}
        disabled={disabled}
        slotProps={{
          textField: {
            fullWidth: true,
            required: required,
            variant: 'outlined',
          },
          actionBar: {
            actions: ['clear'],
          },
        }}
        sx={{
          width: '100%',
        }}
      />
    </Box>
  );
};

export default DatePicker;

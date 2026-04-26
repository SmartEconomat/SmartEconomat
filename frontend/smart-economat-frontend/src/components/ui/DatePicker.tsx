import React from 'react';
import { DatePicker as MUIDatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { Box } from '@mui/material';

/**
 * Documentación en español.
 */
interface DatePickerProps {
        /**
     * Documentación en español.
     */
  label: string;
        /**
     * Documentación en español.
     */
  value: string;
        /**
     * Documentación en español.
     */
  onChange: (name: string, value: string) => void;
        /**
     * Documentación en español.
     */
  name: string;
        /**
     * Documentación en español.
     */
  required?: boolean;
        /**
     * Documentación en español.
     */
  disabled?: boolean;
}

/**
 * Documentación en español.
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

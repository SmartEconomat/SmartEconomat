import React from 'react';
import { DatePicker as MUIDatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { Box } from '@mui/material';

/**
 * Props for the {@link DatePicker} component.
 */
interface DatePickerProps {
  /** Visible label for the date input. */
  label: string;
  /** Current value in `YYYY-MM-DD` format, or an empty string for no value. */
  value: string;
  /** Callback invoked with `(name, formattedDate)` when the date changes. */
  onChange: (name: string, value: string) => void;
  /** Field name used as the first argument of `onChange`. */
  name: string;
  /** If `true`, the field is marked as required. */
  required?: boolean;
  /** If `true`, the picker is read-only and disabled. */
  disabled?: boolean;
}

/**
 * Controlled date picker wrapping MUI X's `DatePicker`.
 *
 * Formats the selected date as `YYYY-MM-DD` and passes it to `onChange`
 * together with the field `name`, making it compatible with generic
 * form-state handlers.  A "clear" action is included in the picker toolbar.
 *
 * @param props - See {@link DatePickerProps}.
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

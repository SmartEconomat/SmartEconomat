import React from 'react';
import { DatePicker as MUIDatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { Box } from '@mui/material';

interface DatePickerProps {
    label: string;
    value: string;
    onChange: (name: string, value: string) => void;
    name: string;
    required?: boolean;
    disabled?: boolean;
}

const DatePicker: React.FC<DatePickerProps> = ({ 
    label, 
    value, 
    onChange, 
    name, 
    required = false, 
    disabled = false 
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
                    }
                }}
                sx={{
                    width: '100%',
                }}
            />
        </Box>
    );
};

export default DatePicker;

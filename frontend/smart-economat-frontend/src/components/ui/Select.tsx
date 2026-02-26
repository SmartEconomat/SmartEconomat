import React from 'react';
import {
    FormControl,
    InputLabel,
    Select as MuiSelect,
    MenuItem,
    FormHelperText,
    SelectProps as MuiSelectProps,
} from '@mui/material';

export interface SelectOption {
    value: string | number;
    label: string;
}

export type SelectProps = MuiSelectProps & {
    label: string;
    name: string;
    options: SelectOption[];
    helperText?: string;
};

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
    const formMargin = (margin as 'none' | 'normal' | 'dense' | undefined) || 'normal';

    return (
        <FormControl fullWidth={fullWidth} margin={formMargin} error={error} required={required}>
            <InputLabel id={`${name}-label`}>{label}</InputLabel>
            <MuiSelect
                labelId={`${name}-label`}
                id={name}
                name={name}
                value={isValueEmpty ? '' : value}
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

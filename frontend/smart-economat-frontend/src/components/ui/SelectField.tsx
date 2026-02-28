import React from 'react';
import { TextField, TextFieldProps, MenuItem } from '@mui/material';

export type SelectOption = {
    value: string | number;
    label: string | React.ReactNode;
};

export type SelectFieldProps = Omit<TextFieldProps, 'select' | 'children'> & {
    options: SelectOption[];
    id: string; // Exigido obligatoriamente para accesibilidad (ARIA)
    label: string; // Exigido obligatoriamente para lectores de pantalla
};

/**
 * Componente Wrapper Accesible para Selects de Material UI.
 * Soluciona el problema de lectores de pantalla (Screen Readers)
 * inyectando dinámicamente el aria-label en el input subyacente.
 */
const SelectField: React.FC<SelectFieldProps> = ({ options, id, label, ...props }) => {
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

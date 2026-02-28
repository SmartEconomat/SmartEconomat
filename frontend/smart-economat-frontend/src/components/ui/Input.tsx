import React from 'react';
import { TextField, TextFieldProps, useTheme } from '@mui/material';

type InputProps = TextFieldProps & {
    label: string;
    name: string;
    type?: string;
    value?: unknown;
    onChange?: React.ChangeEventHandler<HTMLTextAreaElement | HTMLInputElement>;
};

const Input: React.FC<InputProps> = ({ label, name, type = 'text', value, onChange, ...props }) => {
    const theme = useTheme();

    return (
        <TextField
            margin="normal"
            required
            fullWidth
            id={name}
            label={label}
            name={name}
            type={type}
            autoComplete={name}
            value={value}
            onChange={onChange}
            {...props}
        />
    );
};

export default Input;

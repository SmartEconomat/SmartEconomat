import React from 'react';
import { TextField, MenuItem, TextFieldProps } from '@mui/material';

/** Contrato de tipos público (SelectOption). Contexto: smart-economat-frontend (SPA). */
export interface SelectOption {
  value: string | number;
  label: string;
}

/** Alias público (SelectProps) para simplificar payloads o props en smart-economat-frontend (SPA). */
export type SelectProps = TextFieldProps & {
  options?: SelectOption[];
  multiple?: boolean;
};

const Select: React.FC<SelectProps> = ({
  label,
  name,
  options = [],
  helperText,
  error,
  required,
  fullWidth = true,
  margin = 'normal',
  value,
  onChange,
  multiple,
  SelectProps,
  InputLabelProps,
  children,
  ...props
}) => {
  const isMultiple = multiple || SelectProps?.multiple;

  return (
    <TextField
      select
      fullWidth={fullWidth}
      margin={margin}
      label={label}
      name={name}
      id={name}
      value={value ?? (isMultiple ? [] : '')}
      onChange={onChange}
      required={required}
      error={error}
      helperText={helperText}
      SelectProps={{
        multiple: isMultiple,
        displayEmpty: true,
        MenuProps: {
          anchorOrigin: {
            vertical: 'bottom',
            horizontal: 'left',
          },
          transformOrigin: {
            vertical: 'top',
            horizontal: 'left',
          },
          PaperProps: {
            sx: {
              maxHeight: 'min(450px, 80vh)',
              mt: 0.5,
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              border: '1px solid',
              borderColor: 'divider',
              '& .MuiList-root': {
                padding: '4px',
              },
              '& .MuiMenuItem-root': {
                borderRadius: 1,
                margin: '2px 0',
                '&.Mui-selected': {
                  bgcolor: 'rgba(var(--mui-palette-primary-mainChannel), 0.12)',
                  fontWeight: 600,
                  '&:hover': {
                    bgcolor:
                      'rgba(var(--mui-palette-primary-mainChannel), 0.18)',
                  },
                },
              },
            },
          },
          ...SelectProps?.MenuProps,
        },
        ...SelectProps,
      }}
      InputLabelProps={{
        shrink: true,
        ...InputLabelProps,
      }}
      {...props}
    >
      {children ||
        options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
    </TextField>
  );
};

export default Select;

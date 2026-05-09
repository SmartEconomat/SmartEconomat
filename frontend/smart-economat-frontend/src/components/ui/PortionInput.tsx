import React from 'react';
import { TextField, TextFieldProps } from '@mui/material';
import {
  parseLocalizedNumber,
  normalizeNumericInput,
} from '../../utils/numberUtils';

/**
 * Componente de entrada para raciones/porciones.
 * Garantiza que los valores sean múltiplos de 0.5.
 */
const PortionInput: React.FC<TextFieldProps> = (props) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    if (value.startsWith('-')) return;

    const normalized = normalizeNumericInput(value);
    if (props.onChange) {
      const event = {
        ...e,
        target: { ...e.target, value: normalized },
      } as React.ChangeEvent<HTMLInputElement>;
      props.onChange(event);
    }
  };

  return (
    <TextField
      {...props}
      type="text"
      inputProps={{
        inputMode: 'decimal',
        pattern: '[0-9]*[.,]?[0-9]*',
        ...props.inputProps,
      }}
      onChange={handleChange}
      // Aseguramos que al perder el foco se normalice a múltiplo de 0.5
      onBlur={(e) => {
        const val = parseLocalizedNumber(e.target.value);
        if (val !== null && Number.isFinite(val)) {
          const normalized = Math.round(val * 2) / 2;
          if (normalized !== val || e.target.value.includes(',')) {
            // Si el valor no era múltiplo de 0.5 o tenía coma, lo normalizamos
            if (props.onChange) {
              const event = {
                ...e,
                target: { ...e.target, value: normalized.toString() },
              } as unknown as React.ChangeEvent<HTMLInputElement>;
              props.onChange(event);
            }
          }
        }
        if (props.onBlur) props.onBlur(e);
      }}
    />
  );
};

export default PortionInput;

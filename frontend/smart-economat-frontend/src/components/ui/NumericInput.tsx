import React, { useCallback } from 'react';
import { TextFieldProps } from '@mui/material';
import Input from './Input';
import {
  normalizeNumericInput,
  parseLocalizedNumber,
} from '../../utils/numberUtils';

interface NumericInputProps extends Omit<TextFieldProps, 'onChange'> {
  name: string;
  label: string;
  value: string | number | null | undefined;
  onChange: (value: number | null, rawValue: string) => void;
  allowNegative?: boolean;
}

/**
 * Componente especializado para entradas numéricas.
 * Permite tanto '.' como ',' de forma flexible.
 * Normaliza internamente a punto decimal para el estado numérico.
 */
const NumericInput: React.FC<NumericInputProps> = ({
  name,
  label,
  value,
  onChange,
  allowNegative = false,
  ...props
}) => {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const raw = e.target.value;

      // Bloquear negativos si no están permitidos
      if (!allowNegative && raw.startsWith('-')) return;

      // Normalizar entrada (permitir solo números y un separador)
      const normalized = normalizeNumericInput(raw, allowNegative);

      // Parsear para el valor numérico real
      const parsed = parseLocalizedNumber(normalized);

      // Emitir ambos valores: el parseado y el raw (para que el usuario vea lo que escribe)
      onChange(parsed, normalized);
    },
    [allowNegative, onChange]
  );

  return (
    <Input
      {...props}
      name={name}
      label={label}
      type="text"
      value={value ?? ''}
      onChange={handleChange}
      slotProps={{
        inputLabel: {
          shrink: true,
        },
      }}
      inputProps={{
        inputMode: 'decimal',
        pattern: allowNegative ? '^-?[0-9]*[.,]?[0-9]*' : '[0-9]*[.,]?[0-9]*',
        ...props.inputProps,
      }}
    />
  );
};

export default NumericInput;

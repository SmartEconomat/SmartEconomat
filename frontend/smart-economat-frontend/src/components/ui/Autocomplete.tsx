import React, { useState } from 'react';
import {
  Autocomplete as MuiAutocomplete,
  TextField,
  CircularProgress,
  Box,
  Typography,
} from '@mui/material';
import { SelectOption } from './Select';
import SearchIcon from '@mui/icons-material/Search';

export interface AutocompleteProps {
  name: string;
  label: string;
  value: string | number | null;
  options: SelectOption[];
  onChange: (name: string, value: string | number | null) => void;
  onSearch?: (query: string) => void;
  loading?: boolean;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  placeholder?: string;
  disabled?: boolean;
}

const Autocomplete: React.FC<AutocompleteProps> = ({
  name,
  label,
  value,
  options,
  onChange,
  onSearch,
  loading = false,
  required = false,
  error = false,
  helperText,
  placeholder,
  disabled = false,
}) => {
  const [, setInternalInputValue] = useState('');

  // Sincronizar el valor inicial si existe
  const selectedOption = options.find((opt) => opt.value === value) || null;

  const handleInputChange = (
    _event: React.SyntheticEvent,
    newInputValue: string
  ) => {
    setInternalInputValue(newInputValue);
    if (onSearch) {
      onSearch(newInputValue);
    }
  };

  return (
    <MuiAutocomplete
      id={name}
      disabled={disabled}
      options={options}
      getOptionLabel={(option) => option.label}
      value={selectedOption}
      onChange={(_event, newValue) => {
        onChange(name, newValue ? newValue.value : null);
      }}
      onInputChange={handleInputChange}
      loading={loading}
      fullWidth
      isOptionEqualToValue={(option, val) => option.value === val.value}
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: 2,
          transition: 'all 0.2s ease-in-out',
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'primary.main',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderWidth: 2,
          },
        },
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          required={required}
          error={error}
          helperText={helperText}
          placeholder={placeholder || 'Escribe para buscar...'}
          margin="normal"
          slotProps={{
            inputLabel: {
              shrink: true,
            },
            input: {
              ...params.InputProps,
              endAdornment: (
                <React.Fragment>
                  {loading ? (
                    <CircularProgress color="primary" size={20} />
                  ) : null}
                  {params.InputProps.endAdornment}
                </React.Fragment>
              ),
              startAdornment: (
                <React.Fragment>
                  <SearchIcon
                    color="action"
                    sx={{ ml: 1, mr: -0.5, fontSize: 20 }}
                  />
                  {params.InputProps.startAdornment}
                </React.Fragment>
              ),
            },
          }}
        />
      )}
      renderOption={(props, option) => {
        const { key, ...optionProps } = props as React.HTMLAttributes<HTMLLIElement> & { key: string };
        return (
          <Box
            component="li"
            key={key}
            {...optionProps}
            sx={{
              px: 2,
              py: 1,
              borderRadius: 1,
              mx: 1,
              my: 0.5,
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: 'action.hover',
              },
              '&.Mui-selected': {
                bgcolor: 'primary.light',
                color: 'primary.contrastText',
                fontWeight: 600,
                '&:hover': {
                  bgcolor: 'primary.main',
                },
              },
            }}
          >
            <Typography variant="body2">{option.label}</Typography>
          </Box>
        );
      }}
      ListboxProps={{
        sx: {
          p: 1,
          '& .MuiAutocomplete-noOptions': {
            p: 2,
            color: 'text.secondary',
            fontStyle: 'italic',
          },
        },
      }}
      noOptionsText="No se encontraron productos"
      loadingText="Buscando..."
    />
  );
};

export default Autocomplete;

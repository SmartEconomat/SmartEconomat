import React from 'react';
import { Box, Autocomplete, TextField } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';

export interface IncidenciaFiltersState {
  resuelta: boolean | null;
  startDate: string | null;
  endDate: string | null;
}

interface IncidenciaFiltersProps {
  filters: IncidenciaFiltersState;
  onChange: (filters: IncidenciaFiltersState) => void;
}

const STATUS_OPTIONS = [
  { label: 'Pendientes', value: false },
  { label: 'Resueltas', value: true },
];

const IncidenciaFilters: React.FC<IncidenciaFiltersProps> = ({
  filters,
  onChange,
}) => {
  const handleStatusChange = (
    _: unknown,
    newValue: { label: string; value: boolean } | null
  ) => {
    onChange({ ...filters, resuelta: newValue ? newValue.value : null });
  };

  const handleDateChange =
    (field: 'startDate' | 'endDate') =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ ...filters, [field]: e.target.value || null });
    };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 2,
        width: '100%',
        alignItems: 'stretch',
      }}
    >
      <Autocomplete
        id="filter-status"
        options={STATUS_OPTIONS}
        value={
          STATUS_OPTIONS.find((opt) => opt.value === filters.resuelta) || null
        }
        onChange={handleStatusChange}
        getOptionLabel={(option) => option.label}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Estado"
            placeholder="Filtrar por estado..."
            size="small"
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <>
                  <FilterListIcon
                    sx={{ color: 'text.secondary', mr: 1, ml: 0.5 }}
                    fontSize="small"
                  />
                  {params.InputProps.startAdornment}
                </>
              ),
            }}
          />
        )}
        sx={{
          flex: '1 1 auto',
          minWidth: { xs: '100%', sm: 200 },
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            bgcolor: 'background.paper',
          },
        }}
      />

      <TextField
        id="start-date"
        label="Desde"
        type="date"
        size="small"
        value={filters.startDate || ''}
        onChange={handleDateChange('startDate')}
        InputLabelProps={{ shrink: true }}
        sx={{
          width: { xs: '100%', sm: 160 },
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            bgcolor: 'background.paper',
          },
        }}
      />

      <TextField
        id="end-date"
        label="Hasta"
        type="date"
        size="small"
        value={filters.endDate || ''}
        onChange={handleDateChange('endDate')}
        InputLabelProps={{ shrink: true }}
        sx={{
          width: { xs: '100%', sm: 160 },
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            bgcolor: 'background.paper',
          },
        }}
      />
    </Box>
  );
};

export default IncidenciaFilters;

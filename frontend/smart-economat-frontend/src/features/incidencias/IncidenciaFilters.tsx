import React from 'react';
import { Box, TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';

export interface IncidenciaFiltersState {
  startDate: string | null;
  endDate: string | null;
}

interface IncidenciaFiltersProps {
  filters: IncidenciaFiltersState;
  onChange: (filters: IncidenciaFiltersState) => void;
}

const IncidenciaFilters: React.FC<IncidenciaFiltersProps> = ({
  filters,
  onChange,
}) => {
  const { t } = useTranslation();

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
      <TextField
        id="start-date"
        label={t('filters.from')}
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
        label={t('filters.to')}
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

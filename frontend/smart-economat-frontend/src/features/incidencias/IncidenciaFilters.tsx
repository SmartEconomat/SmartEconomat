import React from 'react';
import { Box, TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';

/**
 * Documentación en español.
 */
export interface IncidenciaFiltersState {
  /**
   * Documentación en español.
   */
  startDate: string | null;
  /**
   * Documentación en español.
   */
  endDate: string | null;
}

/**
 * Documentación en español.
 */
interface IncidenciaFiltersProps {
  /**
   * Documentación en español.
   */
  filters: IncidenciaFiltersState;
  /**
   * Documentación en español.
   */
  onChange: (filters: IncidenciaFiltersState) => void;
}

/**
 * Documentación en español.
 */
const IncidenciaFilters: React.FC<IncidenciaFiltersProps> = ({
  filters,
  onChange,
}) => {
  const { t } = useTranslation();

  /**
   * Documentación en español.
   */
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
        label={t('incidencias.filters.desde')}
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
        label={t('incidencias.filters.hasta')}
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

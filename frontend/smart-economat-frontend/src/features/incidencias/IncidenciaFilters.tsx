import React from 'react';
import { Box, TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';

/**
 * Represents the current state of the incidencia date-range filters.
 */
export interface IncidenciaFiltersState {
  /** ISO date string for the start of the filter range, or null if not set. */
  startDate: string | null;
  /** ISO date string for the end of the filter range, or null if not set. */
  endDate: string | null;
}

/**
 * Props for the {@link IncidenciaFilters} component.
 */
interface IncidenciaFiltersProps {
  /** Current filter values. */
  filters: IncidenciaFiltersState;
  /** Callback invoked whenever a filter value changes. */
  onChange: (filters: IncidenciaFiltersState) => void;
}

/**
 * Date-range filter toolbar for the incidencias list.
 * Renders "desde" (from) and "hasta" (to) date pickers.
 *
 * @param {IncidenciaFiltersProps} props - Component props.
 * @returns JSX rendered filter toolbar.
 * @example
 * <IncidenciaFilters filters={filters} onChange={setFilters} />
 */
const IncidenciaFilters: React.FC<IncidenciaFiltersProps> = ({
  filters,
  onChange,
}) => {
  const { t } = useTranslation();

  /**
   * Returns a change handler for a date field.
   *
   * @param field - Which date field to update ('startDate' or 'endDate').
   * @returns An input change handler that updates the specified date field.
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

import React from 'react';
import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import DateRangeFilter from '../../components/ui/DateRangeFilter';

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
export interface IncidenciaFiltersState {
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  startDate: string | null;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  endDate: string | null;
}

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
interface IncidenciaFiltersProps {
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  filters: IncidenciaFiltersState;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  onChange: (filters: IncidenciaFiltersState) => void;
}

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
const IncidenciaFilters: React.FC<IncidenciaFiltersProps> = ({
  filters,
  onChange,
}) => {
  const { t } = useTranslation();

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
      <DateRangeFilter
        startDate={filters.startDate}
        endDate={filters.endDate}
        onChange={(start, end) =>
          onChange({ ...filters, startDate: start, endDate: end })
        }
        startLabel={t('incidencias.filters.desde')}
        endLabel={t('incidencias.filters.hasta')}
      />
    </Box>
  );
};

export default IncidenciaFilters;

import React from 'react';
import { Box, Autocomplete, TextField } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useTranslation } from 'react-i18next';
import DateRangeFilter from '../../components/ui/DateRangeFilter';

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
export interface AlbaranFiltersState {
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  concordancia: boolean | null;
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
interface AlbaranFiltersProps {
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  filters: AlbaranFiltersState;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  onChange: (filters: AlbaranFiltersState) => void;
}

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
const AlbaranFilters: React.FC<AlbaranFiltersProps> = ({
  filters,
  onChange,
}) => {
  const { t } = useTranslation();

  const CONCORDANCIA_OPTIONS = [
    { label: t('albaran.form.conforme'), value: true },
    { label: t('albaran.form.noConforme'), value: false },
  ];

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  const handleConcordanciaChange = (
    _: unknown,
    newValue: { label: string; value: boolean } | null
  ) => {
    onChange({ ...filters, concordancia: newValue ? newValue.value : null });
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
        id="filter-concordancia"
        options={CONCORDANCIA_OPTIONS}
        value={
          CONCORDANCIA_OPTIONS.find(
            (opt) => opt.value === filters.concordancia
          ) || null
        }
        onChange={handleConcordanciaChange}
        getOptionLabel={(option) => option.label}
        renderInput={(params) => (
          <TextField
            {...params}
            label={t('albaran.form.concordancia')}
            placeholder={t('albaran.filters.placeholder')}
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

      <DateRangeFilter
        startDate={filters.startDate}
        endDate={filters.endDate}
        onChange={(start, end) =>
          onChange({ ...filters, startDate: start, endDate: end })
        }
        startLabel={t('albaran.filters.desde')}
        endLabel={t('albaran.filters.hasta')}
      />
    </Box>
  );
};

export default AlbaranFilters;

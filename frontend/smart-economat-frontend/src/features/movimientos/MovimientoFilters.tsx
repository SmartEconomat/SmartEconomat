import React from 'react';
import { Box, Autocomplete, TextField, Chip } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import { TipoMovimiento } from '../../services/movimiento.types';
import { useTranslation } from 'react-i18next';
import { getEnumLabel } from '../../i18n/enumPresentation';
import DateRangeFilter from '../../components/ui/DateRangeFilter';

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
export interface MovimientoFiltersState {
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  types: TipoMovimiento[];
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
interface MovimientoFiltersProps {
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  filters: MovimientoFiltersState;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  onChange: (filters: MovimientoFiltersState) => void;
}

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
const MOVIMIENTO_TYPES = Object.values(TipoMovimiento);

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
const MovimientoFilters: React.FC<MovimientoFiltersProps> = ({
  filters,
  onChange,
}) => {
  const { t } = useTranslation();

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  const handleTypeChange = (
    _: React.SyntheticEvent,
    newValue: TipoMovimiento[]
  ) => {
    onChange({ ...filters, types: newValue });
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
        multiple
        id="filter-types"
        options={MOVIMIENTO_TYPES}
        value={filters.types}
        onChange={handleTypeChange}
        getOptionLabel={(option) => getEnumLabel(t, 'movimientoTipo', option)}
        renderInput={(params) => (
          <TextField
            {...params}
            label={t('movimientos.filtros.tipos')}
            placeholder={t('movimientos.filtros.placeholder')}
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
        renderTags={(value, getTagProps) =>
          value.map((option, index) => (
            <Chip
              label={getEnumLabel(t, 'movimientoTipo', option)}
              size="small"
              {...getTagProps({ index })}
              sx={{
                borderRadius: 1,
                height: 24,
                textTransform: 'capitalize',
                fontWeight: 500,
              }}
            />
          ))
        }
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
        startLabel={t('movimientos.filtros.desde')}
        endLabel={t('movimientos.filtros.hasta')}
      />
    </Box>
  );
};

export default MovimientoFilters;

import React from 'react';
import { Box, Autocomplete, TextField, Chip } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import { TipoMovimiento } from '../../services/movimiento.types';
import { useTranslation } from 'react-i18next';
import { getEnumLabel } from '../../i18n/enumPresentation';

/**
 * Documentación en español.
 */
export interface MovimientoFiltersState {
  /**
   * Documentación en español.
   */
  types: TipoMovimiento[];
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
interface MovimientoFiltersProps {
  /**
   * Documentación en español.
   */
  filters: MovimientoFiltersState;
  /**
   * Documentación en español.
   */
  onChange: (filters: MovimientoFiltersState) => void;
}

/**
 * Documentación en español.
 */
const MOVIMIENTO_TYPES = Object.values(TipoMovimiento);

/**
 * Documentación en español.
 */
const MovimientoFilters: React.FC<MovimientoFiltersProps> = ({
  filters,
  onChange,
}) => {
  const { t } = useTranslation();

  /**
   * Documentación en español.
   */
  const handleTypeChange = (
    _: React.SyntheticEvent,
    newValue: TipoMovimiento[]
  ) => {
    onChange({ ...filters, types: newValue });
  };

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

      <TextField
        id="start-date"
        label={t('movimientos.filtros.desde')}
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
        label={t('movimientos.filtros.hasta')}
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

export default MovimientoFilters;

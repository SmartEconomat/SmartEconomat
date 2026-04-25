import React from 'react';
import { Box, Autocomplete, TextField, Chip } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import { TipoMovimiento } from '../../services/movimiento.types';
import { useTranslation } from 'react-i18next';

/**
 * Represents the current state of the movimiento filter controls.
 */
export interface MovimientoFiltersState {
  /** Array of movement types to filter by (empty means show all types). */
  types: TipoMovimiento[];
  /** ISO date string for the start of the date range, or null if not set. */
  startDate: string | null;
  /** ISO date string for the end of the date range, or null if not set. */
  endDate: string | null;
}

/**
 * Props for the {@link MovimientoFilters} component.
 */
interface MovimientoFiltersProps {
  /** Current filter values. */
  filters: MovimientoFiltersState;
  /** Callback invoked whenever any filter value changes. */
  onChange: (filters: MovimientoFiltersState) => void;
}

/** All available movement type values derived from the TipoMovimiento enum. */
const MOVIMIENTO_TYPES = Object.values(TipoMovimiento);

/**
 * Filter toolbar for the movimientos list.
 * Provides a multi-select autocomplete for movement types and two date
 * pickers for the date range.
 *
 * @param {MovimientoFiltersProps} props - Component props.
 * @returns JSX rendered filter toolbar.
 * @example
 * <MovimientoFilters filters={filters} onChange={setFilters} />
 */
const MovimientoFilters: React.FC<MovimientoFiltersProps> = ({
  filters,
  onChange,
}) => {
  const { t } = useTranslation();

  /**
   * Handles changes to the movement-type multi-select autocomplete.
   *
   * @param _ - Unused synthetic event.
   * @param newValue - The updated array of selected movement types.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleTypeChange = (_: any, newValue: TipoMovimiento[]) => {
    onChange({ ...filters, types: newValue });
  };

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
      <Autocomplete
        multiple
        id="filter-types"
        options={MOVIMIENTO_TYPES}
        value={filters.types}
        onChange={handleTypeChange}
        getOptionLabel={(option) =>
          option.charAt(0).toUpperCase() + option.slice(1).replace('_', ' ')
        }
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
              label={option.replace('_', ' ')}
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

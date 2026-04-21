import React from 'react';
import { Box, Autocomplete, TextField, Chip } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import { TipoMovimiento } from '../../services/movimiento.types';
import { useTranslation } from 'react-i18next';

export interface MovimientoFiltersState {
  types: TipoMovimiento[];
  startDate: string | null;
  endDate: string | null;
}

interface MovimientoFiltersProps {
  filters: MovimientoFiltersState;
  onChange: (filters: MovimientoFiltersState) => void;
}

const MOVIMIENTO_TYPES = Object.values(TipoMovimiento);

const MovimientoFilters: React.FC<MovimientoFiltersProps> = ({
  filters,
  onChange,
}) => {
  const { t } = useTranslation();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleTypeChange = (_: any, newValue: TipoMovimiento[]) => {
    onChange({ ...filters, types: newValue });
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
            label={t('filters.types')}
            placeholder={t('filters.filterByType')}
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

export default MovimientoFilters;

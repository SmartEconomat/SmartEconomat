import React from 'react';
import { Box, Autocomplete, TextField } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useTranslation } from 'react-i18next';

/**
 * Documentación en español.
 */
export interface AlbaranFiltersState {
  /**
   * Documentación en español.
   */
  concordancia: boolean | null;
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
interface AlbaranFiltersProps {
  /**
   * Documentación en español.
   */
  filters: AlbaranFiltersState;
  /**
   * Documentación en español.
   */
  onChange: (filters: AlbaranFiltersState) => void;
}

/**
 * Documentación en español.
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
   * Documentación en español.
   */
  const handleConcordanciaChange = (
    _: unknown,
    newValue: { label: string; value: boolean } | null
  ) => {
    onChange({ ...filters, concordancia: newValue ? newValue.value : null });
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

      <TextField
        id="start-date"
        label={t('albaran.filters.desde')}
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
        label={t('albaran.filters.hasta')}
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

export default AlbaranFilters;

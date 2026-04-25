import React from 'react';
import { Box, Autocomplete, TextField } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useTranslation } from 'react-i18next';

/**
 * Represents the current state of the albaran filter controls.
 */
export interface AlbaranFiltersState {
  /** Whether the albaran is concordant (true), non-concordant (false), or unfiltered (null). */
  concordancia: boolean | null;
  /** ISO date string for the start of the date range, or null if not set. */
  startDate: string | null;
  /** ISO date string for the end of the date range, or null if not set. */
  endDate: string | null;
}

/**
 * Props for the {@link AlbaranFilters} component.
 */
interface AlbaranFiltersProps {
  /** Current filter values. */
  filters: AlbaranFiltersState;
  /** Callback invoked whenever any filter value changes. */
  onChange: (filters: AlbaranFiltersState) => void;
}

/**
 * Filter toolbar for the albaranes list.
 * Provides concordancia (compliant / non-compliant) and date-range controls.
 *
 * @param {AlbaranFiltersProps} props - Component props.
 * @returns JSX rendered filter toolbar.
 * @example
 * <AlbaranFilters filters={filters} onChange={setFilters} />
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
   * Handles changes to the concordancia autocomplete.
   *
   * @param _ - Unused synthetic event.
   * @param newValue - The newly selected option, or null if cleared.
   */
  const handleConcordanciaChange = (
    _: unknown,
    newValue: { label: string; value: boolean } | null
  ) => {
    onChange({ ...filters, concordancia: newValue ? newValue.value : null });
  };

  /**
   * Returns a change handler for a date field.
   *
   * @param field - The filter field to update ('startDate' or 'endDate').
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

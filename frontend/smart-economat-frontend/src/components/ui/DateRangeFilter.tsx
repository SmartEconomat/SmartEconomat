import React, { useMemo } from 'react';
import {
  Box,
  TextField,
  alpha,
  useTheme,
  Typography,
  InputAdornment,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { isDateRangeValid } from '../../utils/date-range-validator';

interface DateRangeFilterProps {
  startDate: string | null;
  endDate: string | null;
  onChange: (start: string | null, end: string | null) => void;
  startLabel?: string;
  endLabel?: string;
  maxDays?: number;
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  startDate,
  endDate,
  onChange,
  startLabel,
  endLabel,
  maxDays = 365,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const validation = useMemo(
    () => isDateRangeValid(startDate, endDate, maxDays),
    [startDate, endDate, maxDays]
  );

  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value || null, endDate);
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(startDate, e.target.value || null);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 1.5,
          alignItems: 'flex-start',
        }}
      >
        <TextField
          id="start-date"
          label={startLabel || t('comun.desde')}
          type="date"
          size="small"
          value={startDate || ''}
          onChange={handleStartChange}
          error={!validation.isValid}
          InputLabelProps={{ shrink: true }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <CalendarMonthIcon
                  sx={{ fontSize: 18, color: 'text.secondary', ml: -0.5 }}
                />
              </InputAdornment>
            ),
          }}
          sx={{
            width: { xs: '100%', sm: 185 },
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              bgcolor: 'background.paper',
              transition: theme.transitions.create([
                'border-color',
                'box-shadow',
              ]),
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.02),
              },
              '&.Mui-focused': {
                bgcolor: 'background.paper',
              },
            },
          }}
        />

        <TextField
          id="end-date"
          label={endLabel || t('comun.hasta')}
          type="date"
          size="small"
          value={endDate || ''}
          onChange={handleEndChange}
          error={!validation.isValid}
          InputLabelProps={{ shrink: true }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <CalendarMonthIcon
                  sx={{ fontSize: 18, color: 'text.secondary', ml: -0.5 }}
                />
              </InputAdornment>
            ),
          }}
          sx={{
            width: { xs: '100%', sm: 185 },
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              bgcolor: 'background.paper',
              transition: theme.transitions.create([
                'border-color',
                'box-shadow',
              ]),
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.02),
              },
              '&.Mui-focused': {
                bgcolor: 'background.paper',
              },
            },
          }}
        />
      </Box>

      <Box sx={{ minHeight: 20, px: 0.5 }}>
        {!validation.isValid && validation.key ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              color: 'error.main',
              animation: 'fadeInSlide 0.25s ease-out',
              '@keyframes fadeInSlide': {
                from: { opacity: 0, transform: 'translateY(-4px)' },
                to: { opacity: 1, transform: 'translateY(0)' },
              },
            }}
          >
            <ErrorOutlineIcon sx={{ fontSize: 14 }} />
            <Typography
              variant="caption"
              sx={{ fontWeight: 600, lineHeight: 1.2 }}
            >
              {t(validation.key, validation.args)}
            </Typography>
          </Box>
        ) : (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ opacity: 0.8, fontSize: '0.65rem', fontStyle: 'italic' }}
          >
            {t('comun.limiteRango', { count: 1, unit: t('comun.anio') })}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default DateRangeFilter;

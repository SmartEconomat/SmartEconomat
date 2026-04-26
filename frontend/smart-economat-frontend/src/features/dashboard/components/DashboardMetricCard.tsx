import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  alpha,
  useTheme,
  Skeleton,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

interface DashboardMetricCardProps {
  title: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  subtitle?: React.ReactNode;
  onClick?: () => void;
  isLoading?: boolean;
}

const DashboardMetricCard: React.FC<DashboardMetricCardProps> = ({
  title,
  value,
  icon,
  color,
  subtitle,
  onClick,
  isLoading = false,
}) => {
  const theme = useTheme();
  const { t, i18n } = useTranslation();

  // Manejador de teclado para accesibilidad
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <Card
      elevation={0}
      role={onClick ? 'button' : 'article'}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      aria-label={t('dashboard.metrics.ariaLabel', {
        title,
        value,
        isLoading,
        isClickable: !!onClick,
      })}
      sx={{
        height: '100%',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': onClick
          ? {
              borderColor: `${color}.main`,
              transform: 'translateY(-4px)',
              boxShadow: theme.shadows[4],
              '& .metric-icon-box': {
                transform: 'scale(1.1) rotate(-5deg)',
                bgcolor: `${color}.main`,
                color: 'common.white',
              },
            }
          : {},
        '&:focus-visible': {
          outline: `2px solid ${theme.palette[color].main}`,
          outlineOffset: '2px',
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ position: 'relative', minHeight: 64 }}>
          <Box sx={{ pr: 7, minWidth: 0 }}>
            <Typography
              variant="subtitle2"
              color="text.secondary"
              fontWeight={600}
              lang={i18n.language}
              sx={{
                textTransform: 'uppercase',
                letterSpacing: '0.02em',
                mb: 0.5,
                lineHeight: 1.2,
                hyphens: 'auto',
                overflowWrap: 'break-word',
              }}
            >
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={800} color="text.primary">
              {isLoading ? (
                <Skeleton variant="text" width={60} height={40} />
              ) : (
                value
              )}
            </Typography>
          </Box>
          <Box
            className="metric-icon-box"
            sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              p: 1.5,
              borderRadius: 2,
              bgcolor: alpha(theme.palette[color].main, 0.1),
              color: `${color}.main`,
              display: 'flex',
              transition: 'all 0.3s ease',
            }}
          >
            {React.isValidElement(icon)
              ? React.cloneElement(
                  icon as React.ReactElement<{
                    fontSize?: string;
                    'aria-hidden'?: string;
                  }>,
                  {
                    fontSize: 'medium',
                    'aria-hidden': 'true',
                  }
                )
              : icon}
          </Box>
        </Box>

        {subtitle && (
          <Box
            sx={{
              mt: 2.5,
              pt: 2,
              borderTop: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                fontWeight: 600,
                color:
                  theme.palette.mode === 'dark'
                    ? 'text.primary'
                    : 'text.secondary',
                opacity: theme.palette.mode === 'dark' ? 0.9 : 1,
              }}
            >
              {subtitle}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default DashboardMetricCard;

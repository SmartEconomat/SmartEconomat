import React from 'react';
import { Paper, Box, Typography, useTheme, alpha } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface DashboardQuickActionProps {
  title: string;
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  onClick: () => void;
  description?: string;
}

const DashboardQuickAction: React.FC<DashboardQuickActionProps> = ({
  title,
  icon,
  color,
  onClick,
  description,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <Paper
      elevation={0}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      aria-label={
        description
          ? t('dashboard.quickAction.ariaWithDesc', {
              titulo: title,
              descripcion: description,
            })
          : t('dashboard.quickAction.ariaNoDesc', { titulo: title })
      }
      sx={{
        p: 2.5,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        display: 'flex',
        alignItems: 'center',
        gap: 2.5,
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          borderColor: `${color}.main`,
          bgcolor: alpha(theme.palette[color].main, 0.04),
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[2],
          '& .action-icon-box': {
            bgcolor: `${color}.main`,
            color: 'common.white',
            transform: 'rotate(-10deg) scale(1.1)',
          },
        },
        '&:active': {
          transform: 'translateY(1px)',
        },
        '&:focus-visible': {
          outline: `2px solid ${theme.palette[color].main}`,
          outlineOffset: '2px',
          bgcolor: alpha(theme.palette[color].main, 0.08),
        },
      }}
    >
      <Box
        className="action-icon-box"
        sx={{
          display: 'flex',
          p: 1.5,
          borderRadius: 2,
          bgcolor: alpha(theme.palette[color].main, 0.1),
          color: `${color}.main`,
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
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="subtitle2" fontWeight={700}>
          {title}
        </Typography>
        {description && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block' }}
          >
            {description}
          </Typography>
        )}
      </Box>
    </Paper>
  );
};

export default DashboardQuickAction;

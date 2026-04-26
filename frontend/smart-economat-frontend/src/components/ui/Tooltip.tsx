import React from 'react';
import {
  Tooltip as MuiTooltip,
  TooltipProps,
  Zoom,
  styled,
  tooltipClasses,
  alpha,
} from '@mui/material';

/**
 * Documentación en español.
 */
const StyledTooltip = styled(({ className, ...props }: TooltipProps) => (
  <MuiTooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor:
      theme.palette.mode === 'dark'
        ? alpha('#0B0E14', 0.9)
        : alpha('#ffffff', 0.9),
    color: theme.palette.text.primary,
    backdropFilter: 'blur(10px)',
    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    borderRadius: '10px',
    padding: '8px 14px',
    fontSize: '0.85rem',
    fontWeight: 500,
    boxShadow: theme.shadows[12],
    maxWidth: 300,
    '& .MuiTypography-root': {
      fontSize: 'inherit',
    },
  },
  [`& .${tooltipClasses.arrow}`]: {
    color:
      theme.palette.mode === 'dark'
        ? alpha('#0B0E14', 0.9)
        : alpha('#ffffff', 0.9),
    '&::before': {
      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    },
  },
}));

/**
 * Documentación en español.
 */
export const Tooltip = (props: TooltipProps) => {
  return (
    <StyledTooltip
      TransitionComponent={Zoom}
      arrow
      placement="right"
      enterDelay={400} // Ligeramente más pausado para evitar ruidos visuales
      leaveDelay={0}
      {...props}
    />
  );
};

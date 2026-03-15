import React from 'react';
import { Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import FiberNewIcon from '@mui/icons-material/FiberNew';

interface StatusChipProps {
  status: string;
}

const StatusChip: React.FC<StatusChipProps> = ({ status }) => {
  let color: 'success' | 'warning' | 'info' | 'error' | 'default' = 'default';
  let icon = null;

  // Limpiar emojis residuales que hayan quedado oxidados en el localStorage del navegador
  let cleanStatus = status.replace(/✅|⚠️|🔵|❌|🆕/g, '').trim();

  if (cleanStatus === 'OK') {
    color = 'success';
    icon = <CheckCircleIcon fontSize="small" />;
  } else if (cleanStatus === 'Parcial') {
    color = 'warning';
    icon = <WarningAmberIcon fontSize="small" />;
  } else if (cleanStatus === 'Exceso') {
    color = 'info';
    icon = <InfoOutlinedIcon fontSize="small" />;
  } else if (cleanStatus === 'No entregado') {
    color = 'error';
    icon = <ErrorOutlineIcon fontSize="small" />;
  } else if (cleanStatus.toLowerCase() === 'nuevo') {
    color = 'success';
    icon = <FiberNewIcon fontSize="small" />;
    cleanStatus = 'Nuevo';
  }

  return (
    <Chip
      icon={icon || undefined}
      label={cleanStatus}
      size="small"
      color={color}
      variant="outlined"
      sx={{
        minWidth: { xs: '32px', sm: '130px' },
        maxWidth: { xs: '32px', sm: '130px' },
        justifyContent: { xs: 'center', sm: 'flex-start' },
        fontWeight: 600,
        borderWidth: { xs: 0, sm: 2 },
        color: (theme) =>
          theme.palette.mode === 'dark' && color !== 'default'
            ? theme.palette[color].light
            : undefined,
        borderColor: (theme) =>
          theme.palette.mode === 'dark' && color !== 'default'
            ? theme.palette[color].light
            : undefined,
        px: { xs: 0, sm: 1 },
        '& .MuiChip-icon': {
          color: 'inherit',
          ml: { xs: 0, sm: '-4px' },
          mr: { xs: 0, sm: '4px' },
        },
        '& .MuiChip-label': {
          display: { xs: 'none', sm: 'block' },
          px: 0,
        },
      }}
    />
  );
};

export default StatusChip;

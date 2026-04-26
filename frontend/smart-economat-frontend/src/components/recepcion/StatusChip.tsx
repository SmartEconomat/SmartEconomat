import React from 'react';
import { Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import FiberNewIcon from '@mui/icons-material/FiberNew';
import { useTranslation } from 'react-i18next';
import { getEnumLabel } from '../../i18n/enumPresentation';

interface StatusChipProps {
  status: string;
}

const StatusChip: React.FC<StatusChipProps> = ({ status }) => {
  const { t } = useTranslation();
  let color: 'success' | 'warning' | 'info' | 'error' | 'default' = 'default';
  let icon = null;
  let label: string;

  const cleanStatus = status.replace(/✅|⚠️|🔵|❌|🆕/g, '').trim();

  const normalized = cleanStatus.toUpperCase().replace(/\s+/g, '_');

  if (normalized === 'OK') {
    color = 'success';
    icon = <CheckCircleIcon fontSize="small" />;
    label = t('recepcion.estadoLinea.ok');
  } else if (normalized === 'PARCIAL') {
    color = 'warning';
    icon = <WarningAmberIcon fontSize="small" />;
    label = t('recepcion.estadoLinea.parcial');
  } else if (normalized === 'EXCESO') {
    color = 'info';
    icon = <InfoOutlinedIcon fontSize="small" />;
    label = t('recepcion.estadoLinea.exceso');
  } else if (normalized === 'NO_ENTREGADO') {
    color = 'error';
    icon = <ErrorOutlineIcon fontSize="small" />;
    label = t('recepcion.estadoLinea.noEntregado');
  } else if (normalized === 'NUEVO') {
    color = 'success';
    icon = <FiberNewIcon fontSize="small" />;
    label = t('recepcion.estadoLinea.nuevo');
  } else {
    label = getEnumLabel(t, 'pedidoEstado', cleanStatus);
  }

  return (
    <Chip
      icon={icon || undefined}
      label={label}
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

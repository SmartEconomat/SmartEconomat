import React from 'react';
import dayjs from 'dayjs';
import { Alert, Button, Stack, Typography } from '@mui/material';
import { PedidoDraftRecord } from '../../../services/pedidoDraft.service';

interface PedidoDraftBannerProps {
  draft: PedidoDraftRecord | null;
  onRecover: () => void;
  onDiscard: () => void;
}

const PedidoDraftBanner: React.FC<PedidoDraftBannerProps> = ({
  draft,
  onRecover,
  onDiscard,
}) => {
  if (!draft) return null;

  return (
    <Alert
      severity="info"
      sx={{ mb: 3, alignItems: 'center' }}
      action={
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button color="inherit" size="small" onClick={onRecover}>
            Recuperar
          </Button>
          <Button color="inherit" size="small" onClick={onDiscard}>
            Descartar
          </Button>
        </Stack>
      }
    >
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        Hay un pedido pendiente de finalizar.
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Última actualización:{' '}
        {dayjs(draft.updatedAt).isValid()
          ? dayjs(draft.updatedAt).format('DD/MM/YYYY HH:mm')
          : 'fecha no disponible'}
      </Typography>
    </Alert>
  );
};

export default PedidoDraftBanner;

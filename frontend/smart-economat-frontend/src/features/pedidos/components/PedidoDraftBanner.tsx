import React from 'react';
import dayjs from 'dayjs';
import { Alert, Button, Stack, Typography } from '@mui/material';
import { PedidoDraftRecord } from '../../../services/pedidoDraft.service';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

  if (!draft) return null;

  return (
    <Alert
      severity="info"
      sx={{ mb: 3, alignItems: 'center' }}
      action={
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button color="inherit" size="small" onClick={onRecover}>
            {t('pedidos.draft.recover')}
          </Button>
          <Button color="inherit" size="small" onClick={onDiscard}>
            {t('pedidos.draft.discard')}
          </Button>
        </Stack>
      }
    >
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {t('pedidos.draft.pending')}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {t('pedidos.draft.lastUpdate')}{' '}
        {dayjs(draft.updatedAt).isValid()
          ? dayjs(draft.updatedAt).format('DD/MM/YYYY HH:mm')
          : t('pedidos.draft.noDate')}
      </Typography>
    </Alert>
  );
};

export default PedidoDraftBanner;

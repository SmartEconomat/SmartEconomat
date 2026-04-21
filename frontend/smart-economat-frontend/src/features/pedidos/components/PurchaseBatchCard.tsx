import React, { ReactNode } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Divider,
  Stack,
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LayersIcon from '@mui/icons-material/Layers';
import { Pedido, PurchaseBatch } from '../../../services/pedido.types';
import StatusChip from '../../../components/ui/StatusChip';
import {
  formatBatchNumber,
  formatBatchReference,
  formatPedidoDate,
  formatCurrency,
  getPedidoCreatorName,
  getBatchTotal,
  getBatchPedidosCount,
} from '../utils/pedidoFormatters';
import { useTranslation } from 'react-i18next';

interface PurchaseBatchCardProps {
  batch: PurchaseBatch;
  actions?: ReactNode;
  onRowClick?: (batch: PurchaseBatch) => void;
}

const PurchaseBatchCard: React.FC<PurchaseBatchCardProps> = ({
  batch,
  actions,
  onRowClick,
}) => {
  const { t } = useTranslation();
  const isSelectable = !!onRowClick;
  const totalCost = getBatchTotal(batch);
  const pedidosCount = getBatchPedidosCount(batch);

  return (
    <Card
      variant="outlined"
      onClick={onRowClick ? () => onRowClick(batch) : undefined}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'all 0.2s ease-in-out',
        cursor: isSelectable ? 'pointer' : 'default',
        borderLeft: (theme) => `4px solid ${theme.palette.primary.main}`,
        '&:hover': isSelectable
          ? {
              borderColor: 'primary.main',
              boxShadow: (theme) => `0 0 0 1px ${theme.palette.primary.main}`,
              transform: 'translateY(-2px)',
            }
          : {},
      }}
    >
      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
          mb={2}
        >
          <Box>
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ lineHeight: 1, fontSize: '0.65rem' }}
            >
              {t('pedidos.batchCard.batchPrefix')}
              {formatBatchNumber(batch)}
            </Typography>
            <Typography
              variant="caption"
              color="text.disabled"
              display="block"
              sx={{ mt: 0.5 }}
            >
              {t('pedidos.batchCard.ref')} {formatBatchReference(batch)}
            </Typography>
          </Box>
          <StatusChip status={batch.estado} size="small" />
        </Box>

        <Box sx={{ mb: 2 }}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <LayersIcon sx={{ fontSize: 20, color: 'primary.main' }} />
            <Typography
              variant="h6"
              sx={{ fontWeight: 'bold', lineHeight: 1.2 }}
            >
              {pedidosCount} {t('pedidos.batchCard.providerOrders')}
            </Typography>
          </Box>
        </Box>

        <Stack spacing={1} sx={{ mt: 2 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <CalendarTodayIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {t('pedidos.batchCard.createdAt')}{' '}
              {formatPedidoDate(batch.createdAt, 'datetime')}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <PersonOutlineIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary" noWrap>
              {getPedidoCreatorName(batch as unknown as Pedido)}
            </Typography>
          </Box>
        </Stack>

        <Box
          sx={{
            mt: 3,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
          }}
        >
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              sx={{ fontWeight: 500 }}
            >
              {t('pedidos.batchCard.estimatedInvestment')}
            </Typography>
            <Typography
              variant="h5"
              fontWeight="bold"
              color="primary.main"
              sx={{ lineHeight: 1 }}
            >
              {formatCurrency(totalCost)}
            </Typography>
          </Box>
        </Box>
      </CardContent>

      <Divider />

      <CardActions
        sx={{
          justifyContent: 'flex-end',
          p: 1,
          px: 2,
          bgcolor: 'rgba(25, 118, 210, 0.04)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Stack direction="row" spacing={0.5}>
          {actions}
        </Stack>
      </CardActions>
    </Card>
  );
};

export default PurchaseBatchCard;

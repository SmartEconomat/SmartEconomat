import React, { ReactNode } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Divider,
  Stack,
  Checkbox,
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import { PedidoListItem } from '../../../services/pedido.types';
import StatusChip from '../../../components/ui/StatusChip';
import {
  formatPedidoDate,
  formatCurrency,
  formatPedidoListNumber,
  formatPedidoId,
  getPedidoCreatorName,
  getPedidoProviderName,
} from '../utils/pedidoFormatters';
import { useTranslation } from 'react-i18next';

interface PedidoCardProps {
  pedido: PedidoListItem;
  actions?: ReactNode;
  onRowClick?: (pedido: PedidoListItem) => void;
  selectionProps?: {
    checked: boolean;
    indeterminate?: boolean;
    disabled?: boolean;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  };
}

/**
 * @description Card representation of a single PedidoListItem for the grid view.
 * Displays key pedido metadata (number, dates, cost, status, creator) and optionally
 * renders inline action buttons and a checkbox for bulk selection.
 * @param props.pedido - The pedido data to display
 * @param props.actions - Optional React node with action buttons rendered in the card footer
 * @param props.onRowClick - Optional click handler; when provided the card becomes interactive
 * @param props.selectionProps - Optional checkbox configuration for bulk-select mode
 * @returns MUI Card component representing a single pedido
 */
const PedidoCard: React.FC<PedidoCardProps> = ({
  pedido,
  actions,
  onRowClick,
  selectionProps,
}) => {
  const { t } = useTranslation();
  const isSelectable = !!onRowClick;

  return (
    <Card
      variant="outlined"
      onClick={onRowClick ? () => onRowClick(pedido) : undefined}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'all 0.2s ease-in-out',
        cursor: isSelectable ? 'pointer' : 'default',
        ...(selectionProps?.checked && {
          borderColor: 'primary.main',
          boxShadow: (theme) => `0 0 0 1px ${theme.palette.primary.main}`,
        }),
        '&:hover': isSelectable
          ? {
              borderColor: 'primary.main',
              boxShadow: (theme) => `0 0 0 1px ${theme.palette.primary.main}`,
              transform: 'translateY(-2px)',
            }
          : {},
      }}
    >
      {selectionProps && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 8,
            left: 12,
            zIndex: 2,
            backgroundColor: 'background.paper',
            borderRadius: '50%',
            boxShadow: 2,
            border: (theme) => `1px solid ${theme.palette.divider}`,
            '& .MuiCheckbox-root': { p: 0.5 },
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Checkbox
            size="small"
            checked={selectionProps.checked}
            indeterminate={selectionProps.indeterminate}
            disabled={selectionProps.disabled}
            onChange={selectionProps.onChange}
          />
        </Box>
      )}

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
              {t('pedidos.card.orderPrefix')}
              {formatPedidoListNumber(pedido)}
            </Typography>
            <Typography variant="caption" color="text.disabled" display="block">
              ID: {formatPedidoId(pedido.id)}
            </Typography>
          </Box>
          <StatusChip status={pedido.estado} size="small" />
        </Box>

        <Typography
          variant="h6"
          sx={{
            fontWeight: 'bold',
            mb: 1,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: '2.4em',
            lineHeight: 1.2,
          }}
        >
          {getPedidoProviderName(pedido)}
        </Typography>

        <Stack spacing={1} sx={{ mt: 2 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <CalendarTodayIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {formatPedidoDate(pedido.fechaPedido, 'datetime')}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <PersonOutlineIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary" noWrap>
              {getPedidoCreatorName(pedido)}
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
              {t('pedidos.card.estimatedCost')}
            </Typography>
            <Typography
              variant="h6"
              fontWeight="bold"
              color="primary.main"
              sx={{ lineHeight: 1 }}
            >
              {formatCurrency(pedido.costeTotal)}
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
          bgcolor: 'rgba(0,0,0,0.02)',
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

export default PedidoCard;

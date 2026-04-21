import React from 'react';
import { IconButton, Stack, Tooltip, Chip, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CancelIcon from '@mui/icons-material/Cancel';
import LoginOutlinedIcon from '@mui/icons-material/LoginOutlined';
import { Column } from '../../../components/ui/DataTable';
import StatusChip from '../../../components/ui/StatusChip';
import {
  isPendingPedidoUsuarioStatus,
  PedidoListItem,
  PurchaseBatch,
} from '../../../services/pedido.types';
import {
  PedidoActionHandlers,
  PedidoPermissions,
  PurchaseBatchActionHandlers,
} from '../types/pedidos-ui.types';
import {
  formatPedidoListNumber,
  formatCurrency,
  formatPedidoDate,
  getBatchPedidosCount,
  getBatchTotal,
  getPedidoCreatorName,
} from './pedidoFormatters';
import { isPedidoUsuarioRow } from './pedidoOwnOrders';
import type { TFunction } from 'i18next';

export const buildPedidoColumns = (t: TFunction): Column<PedidoListItem>[] => [
  {
    id: 'pedidoId',
    label: t('pedidos.columns.numeroPedido'),
    render: (row) => formatPedidoListNumber(row),
  },
  {
    id: 'fechaPedido',
    label: t('pedidos.columns.fechaPedido'),
    render: (row) => formatPedidoDate(row.fechaPedido),
  },
  {
    id: 'fechaEntrega',
    label: t('pedidos.columns.fechaEntrega'),
    render: (row) => formatPedidoDate(row.fechaEntrega),
    hideOnMobile: true,
  },
  {
    id: 'costeTotal',
    label: t('pedidos.columns.costeTotal'),
    align: 'right',
    render: (row) => formatCurrency(row.costeTotal),
  },
  {
    id: 'estado',
    label: t('pedidos.columns.estado'),
    render: (row) => <StatusChip status={row.estado} />,
  },
  {
    id: 'usuario',
    label: t('pedidos.columns.creadoPor'),
    render: (row) => getPedidoCreatorName(row),
    hideOnMobile: true,
  },
];

export const buildBatchColumns = (t: TFunction): Column<PurchaseBatch>[] => [
  {
    id: 'createdAt',
    label: t('pedidos.columns.fechaPedido'),
    render: (row) => formatPedidoDate(row.createdAt, 'datetime'),
  },
  {
    id: 'pedidos',
    label: t('pedidos.columns.numeroPedidos'),
    render: (row) => getBatchPedidosCount(row),
  },
  {
    id: 'costeTotal',
    label: t('pedidos.columns.costeTotalEstimado'),
    align: 'right',
    render: (row) => formatCurrency(getBatchTotal(row)),
  },
  {
    id: 'estado',
    label: t('pedidos.columns.estado'),
    render: (row) => <StatusChip status={String(row.estado)} />,
  },
  {
    id: 'usuario',
    label: t('pedidos.columns.creadoPor'),
    render: (row) => row.usuario?.nombre || row.usuario?.username || '—',
  },
];

export const renderPedidoActions = (
  row: PedidoListItem,
  permissions: PedidoPermissions,
  handlers: PedidoActionHandlers,
  t: TFunction
): React.ReactNode =>
  isPedidoUsuarioRow(row) ? (
    <Stack direction="row" spacing={1} justifyContent="center">
      {permissions.canApprove &&
        isPendingPedidoUsuarioStatus(String(row.estado)) && (
          <Tooltip title={t('pedidos.actions.approve')}>
            <IconButton
              color="success"
              onClick={() => handlers.onApprove(row)}
              size="small"
              aria-label={t('pedidos.actions.approve')}
            >
              <CheckIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}

      {permissions.canCancel &&
        isPendingPedidoUsuarioStatus(String(row.estado)) && (
          <Tooltip title={t('pedidos.actions.cancel')}>
            <IconButton
              color="warning"
              onClick={() => handlers.onCancel(row)}
              size="small"
              aria-label={t('pedidos.actions.cancel')}
            >
              <CancelIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}

      {permissions.canEdit &&
        isPendingPedidoUsuarioStatus(String(row.estado)) && (
          <Tooltip title={t('pedidos.actions.edit')}>
            <IconButton
              color="secondary"
              onClick={() => handlers.onEdit(row)}
              size="small"
              aria-label={t('pedidos.actions.edit')}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}

      {!isPendingPedidoUsuarioStatus(String(row.estado)) && (
        <Chip
          size="small"
          color="default"
          variant="outlined"
          label={
            <Typography variant="caption">
              {t('pedidos.chips.pedido')}
            </Typography>
          }
        />
      )}
    </Stack>
  ) : (
    <Stack direction="row" spacing={1} justifyContent="center">
      <Chip
        size="small"
        color="default"
        variant="outlined"
        label={
          <Typography variant="caption">
            {t('pedidos.chips.interno')}
          </Typography>
        }
      />
    </Stack>
  );

export const renderBatchActions = (
  row: PurchaseBatch,
  handlers: PurchaseBatchActionHandlers,
  t: TFunction
): React.ReactNode => (
  <Stack direction="row" spacing={1} justifyContent="center">
    <Tooltip title={t('pedidos.actions.startReception')}>
      <IconButton
        color="success"
        onClick={(e) => {
          e.stopPropagation();
          handlers.onRecepcion(row);
        }}
        size="small"
        aria-label={t('pedidos.actions.startReception')}
      >
        <LoginOutlinedIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  </Stack>
);

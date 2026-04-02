import React from 'react';
import { IconButton, Stack, Tooltip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import CancelIcon from '@mui/icons-material/Cancel';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import RestoreIcon from '@mui/icons-material/Restore';
import { Column } from '../../../components/ui/DataTable';
import StatusChip from '../../../components/ui/StatusChip';
import {
  EstadoPedido,
  Pedido,
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
import { isAggregatedBatchPedido } from './pedidoOwnOrders';
import { getNextBatchAction } from './purchaseBatchUtils';

export const buildPedidoColumns = (options?: {
  hideCreator?: boolean;
}): Column<Pedido>[] => {
  const cols: Column<Pedido>[] = [
    {
      id: 'pedidoId',
      label: 'Nº de pedido',
      render: (row) => formatPedidoListNumber(row),
      sortable: true,
    },
    {
      id: 'fechaPedido',
      label: 'Fecha Pedido',
      render: (row) => formatPedidoDate(row.fechaPedido),
      sortable: true,
    },
    {
      id: 'fechaEntrega',
      label: 'Fecha Entrega',
      render: (row) => formatPedidoDate(row.fechaEntrega),
      sortable: true,
      hideOnMobile: true,
    },
    {
      id: 'costeTotal',
      label: 'Coste Total',
      align: 'right',
      render: (row) => formatCurrency(row.costeTotal),
      sortable: true,
    },
    {
      id: 'estado',
      label: 'Estado',
      render: (row) => <StatusChip status={row.estado} />,
      sortable: true,
    },
  ];

  if (!options?.hideCreator) {
    cols.push({
      id: 'usuario',
      label: 'Creado Por',
      render: (row) => getPedidoCreatorName(row),
      sortable: true,
      hideOnMobile: true,
    });
  }

  return cols;
};

export const buildBatchColumns = (): Column<PurchaseBatch>[] => [
  {
    id: 'createdAt',
    label: 'Fecha Creación',
    render: (row) => formatPedidoDate(row.createdAt, 'datetime'),
    sortable: true,
  },
  {
    id: 'pedidos',
    label: 'Nº Pedidos',
    render: (row) => getBatchPedidosCount(row),
    sortable: true,
  },
  {
    id: 'costeTotal',
    label: 'Coste Total Estimado',
    align: 'right',
    render: (row) => formatCurrency(getBatchTotal(row)),
    sortable: true,
  },
  {
    id: 'estado',
    label: 'Estado',
    render: (row) => <StatusChip status={String(row.estado)} />,
    sortable: true,
  },
  {
    id: 'usuario',
    label: 'Creado Por',
    render: (row) => row.usuario?.nombre || row.usuario?.username || '—',
    sortable: true,
  },
];

export const renderPedidoActions = (
  row: Pedido,
  permissions: PedidoPermissions,
  handlers: PedidoActionHandlers,
  currentUserId?: string
): React.ReactNode => {
  const isOwner = !!currentUserId && row.usuario?.id === currentUserId;
  const canDelete =
    permissions.canDelete || (isOwner && row.estado === EstadoPedido.PENDIENTE);

  return isAggregatedBatchPedido(row) ? (
    <Stack direction="row" spacing={1} justifyContent="center">
      {permissions.canApprove && row.estado === EstadoPedido.PENDIENTE && (
        <Tooltip title="Aprobar">
          <IconButton
            color="success"
            onClick={() => handlers.onApprove(row)}
            size="small"
            aria-label="Aprobar"
          >
            <CheckIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      {permissions.canCancel && row.estado === EstadoPedido.PENDIENTE && (
        <Tooltip title="Cancelar">
          <IconButton
            color="warning"
            onClick={() => handlers.onCancel(row)}
            size="small"
            aria-label="Cancelar"
          >
            <CancelIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      {permissions.canEdit && row.estado === EstadoPedido.PENDIENTE && (
        <Tooltip title="Editar">
          <IconButton
            color="secondary"
            onClick={() => handlers.onEdit(row)}
            size="small"
            aria-label="Editar"
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      {canDelete && row.estado === EstadoPedido.PENDIENTE && (
        <Tooltip title="Eliminar">
          <IconButton
            color="error"
            onClick={() => handlers.onDelete(row)}
            size="small"
            aria-label="Eliminar"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      {permissions.canRestore && row.estado === EstadoPedido.CANCELADO && (
        <Tooltip title="Revertir">
          <IconButton
            color="info"
            onClick={() => handlers.onRestore(row)}
            size="small"
            aria-label="Revertir"
          >
            <RestoreIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  ) : (
    <Stack direction="row" spacing={1} justifyContent="center">
      <Tooltip title="Fecha estimada de entrega">
        <span>
          <IconButton
            color="info"
            onClick={() => handlers.onViewDelivery(row)}
            size="small"
            aria-label="Ver fecha de entrega"
          >
            <EventOutlinedIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>

      {permissions.canApprove && row.estado === EstadoPedido.PENDIENTE && (
        <Tooltip title="Aprobar pedido">
          <IconButton
            color="success"
            onClick={() => handlers.onApprove(row)}
            size="small"
            aria-label="Aprobar"
          >
            <CheckIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      {permissions.canCancel && row.estado === EstadoPedido.PENDIENTE && (
        <Tooltip title="Cancelar pedido">
          <IconButton
            color="warning"
            onClick={() => handlers.onCancel(row)}
            size="small"
            aria-label="Cancelar"
          >
            <CancelIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      {canDelete && row.estado === EstadoPedido.PENDIENTE && (
        <Tooltip title="Eliminar pedido">
          <IconButton
            color="error"
            onClick={() => handlers.onDelete(row)}
            size="small"
            aria-label="Eliminar"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      {permissions.canEdit && row.estado === EstadoPedido.PENDIENTE && (
        <Tooltip title="Editar pedido">
          <IconButton
            color="secondary"
            onClick={() => handlers.onEdit(row)}
            size="small"
            aria-label="Editar"
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      {permissions.canRestore && row.estado === EstadoPedido.CANCELADO && (
        <Tooltip title="Revertir">
          <IconButton
            color="info"
            onClick={() => handlers.onRestore(row)}
            size="small"
            aria-label="Revertir"
          >
            <RestoreIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      {row.distribuciones?.some((d) => d.estado === 'preparada') && (
        <Tooltip title="Confirmar recepción">
          <IconButton
            color="success"
            onClick={() => handlers.onConfirmReceipt(row)}
            size="small"
            aria-label="Confirmar recepción"
          >
            <CheckIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  );
};

export const renderBatchActions = (
  row: PurchaseBatch,
  handlers: PurchaseBatchActionHandlers
): React.ReactNode => {
  const nextAction = getNextBatchAction(row);
  const Icon = nextAction.icon;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (nextAction.action === 'tramitar') handlers.onTramitar(row);
    if (nextAction.action === 'recepcion') handlers.onRecepcion(row);
    if (nextAction.action === 'distribucion') handlers.onDistribucion?.(row);
  };

  return (
    <Stack direction="row" spacing={1} justifyContent="center">
      <Tooltip title={nextAction.tooltip || nextAction.label}>
        <span>
          <IconButton
            color={nextAction.color}
            onClick={handleClick}
            size="small"
            disabled={nextAction.disabled}
            aria-label={nextAction.label}
          >
            <Icon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  );
};

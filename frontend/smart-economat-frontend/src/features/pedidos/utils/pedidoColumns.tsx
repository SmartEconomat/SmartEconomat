import React from 'react';
import { IconButton, Stack, Tooltip } from '@mui/material';
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

export const buildPedidoColumns = (): Column<PedidoListItem>[] => [
  {
    id: 'pedidoId',
    label: 'Nº de pedido',
    render: (row) => formatPedidoListNumber(row),
  },
  {
    id: 'fechaPedido',
    label: 'Fecha Pedido',
    render: (row) => formatPedidoDate(row.fechaPedido),
  },
  {
    id: 'fechaEntrega',
    label: 'Fecha Entrega',
    render: (row) => formatPedidoDate(row.fechaEntrega),
    hideOnMobile: true,
  },
  {
    id: 'costeTotal',
    label: 'Coste Total',
    align: 'right',
    render: (row) => formatCurrency(row.costeTotal),
  },
  {
    id: 'estado',
    label: 'Estado',
    render: (row) => <StatusChip status={row.estado} />,
  },
  {
    id: 'usuario',
    label: 'Creado Por',
    render: (row) => getPedidoCreatorName(row),
    hideOnMobile: true,
  },
];

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
  row: PedidoListItem,
  permissions: PedidoPermissions,
  handlers: PedidoActionHandlers
): React.ReactNode =>
  isPedidoUsuarioRow(row) ? (
    <Stack direction="row" spacing={1} justifyContent="center">
      {permissions.canApprove &&
        isPendingPedidoUsuarioStatus(String(row.estado)) && (
          <Tooltip title="Aprobar pedido">
            <IconButton
              color="success"
              onClick={() => handlers.onApprove(row)}
              size="small"
              aria-label="Aprobar pedido"
            >
              <CheckIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}

      {permissions.canCancel &&
        isPendingPedidoUsuarioStatus(String(row.estado)) && (
          <Tooltip title="Cancelar pedido">
            <IconButton
              color="warning"
              onClick={() => handlers.onCancel(row)}
              size="small"
              aria-label="Cancelar pedido"
            >
              <CancelIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}

      {permissions.canEdit &&
        isPendingPedidoUsuarioStatus(String(row.estado)) && (
          <Tooltip title="Editar pedido">
            <IconButton
              color="secondary"
              onClick={() => handlers.onEdit(row)}
              size="small"
              aria-label="Editar pedido"
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
          label={<Typography variant="caption">Pedido</Typography>}
        />
      )}
    </Stack>
  ) : (
    <Stack direction="row" spacing={1} justifyContent="center">
      <Chip
        size="small"
        color="default"
        variant="outlined"
        label={<Typography variant="caption">Interno</Typography>}
      />
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

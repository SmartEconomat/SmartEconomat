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

/**
 * @description Builds the column definitions for the main pedidos DataTable.
 * @returns Array of Column<PedidoListItem> objects with render functions for each column
 */
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

/**
 * @description Builds the column definitions for the purchase batches DataTable.
 * @returns Array of Column<PurchaseBatch> objects with render functions for each column
 */
export const buildBatchColumns = (): Column<PurchaseBatch>[] => [
  {
    id: 'createdAt',
    label: 'Fecha Creación',
    render: (row) => formatPedidoDate(row.createdAt, 'datetime'),
  },
  {
    id: 'pedidos',
    label: 'Nº Pedidos',
    render: (row) => getBatchPedidosCount(row),
  },
  {
    id: 'costeTotal',
    label: 'Coste Total Estimado',
    align: 'right',
    render: (row) => formatCurrency(getBatchTotal(row)),
  },
  {
    id: 'estado',
    label: 'Estado',
    render: (row) => <StatusChip status={String(row.estado)} />,
  },
  {
    id: 'usuario',
    label: 'Creado Por',
    render: (row) => row.usuario?.nombre || row.usuario?.username || '—',
  },
];

/**
 * @description Renders the inline action buttons for a pedido row.
 * Approve, cancel, and edit buttons are shown conditionally based on permissions and order status.
 * For non-user (internal) orders a read-only chip is shown instead.
 * @param row - The pedido row to render actions for
 * @param permissions - Permission flags controlling which buttons are visible
 * @param handlers - Callbacks invoked when action buttons are clicked
 * @returns React node containing the action buttons or status chip
 */
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

/**
 * @description Renders the inline action button for a purchase batch row (initiate reception).
 * @param row - The PurchaseBatch to render the action for
 * @param handlers - Callbacks invoked when action buttons are clicked
 * @returns React node containing the reception action button
 */
export const renderBatchActions = (
  row: PurchaseBatch,
  handlers: PurchaseBatchActionHandlers
): React.ReactNode => (
  <Stack direction="row" spacing={1} justifyContent="center">
    <Tooltip title="Iniciar Recepción">
      <IconButton
        color="success"
        onClick={(e) => {
          e.stopPropagation();
          handlers.onRecepcion(row);
        }}
        size="small"
        aria-label="Iniciar Recepción"
      >
        <LoginOutlinedIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  </Stack>
);

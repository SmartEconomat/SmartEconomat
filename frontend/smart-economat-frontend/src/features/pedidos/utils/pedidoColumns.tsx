import React from 'react';
import { IconButton, Stack, Tooltip, Chip, Typography } from '@mui/material';
import i18n from '../../../i18n';
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
 * Construye pedido columns a partir de los parámetros recibidos.
 * @returns Valor resultante de la operación.
 */
/**
 * Expone "buildPedidoColumns" en smart-economat-frontend (SPA).
 * @undefined {Column<PedidoListItem>[]} Datos efectivos después de ejecutar la operación.
 */
export const buildPedidoColumns = (): Column<PedidoListItem>[] => [
  {
    id: 'pedidoId',
    label: i18n.t('pedidos.columnsList.pedidoId'),
    render: (row) => formatPedidoListNumber(row),
  },
  {
    id: 'fechaPedido',
    label: i18n.t('pedidos.columnsList.fechaPedido'),
    render: (row) => formatPedidoDate(row.fechaPedido),
  },
  {
    id: 'fechaEntrega',
    label: i18n.t('pedidos.columnsList.fechaEntrega'),
    render: (row) => formatPedidoDate(row.fechaEntrega),
    hideOnMobile: true,
  },
  {
    id: 'costeTotal',
    label: i18n.t('pedidos.columnsList.costeTotal'),
    align: 'right',
    render: (row) => formatCurrency(row.costeTotal),
  },
  {
    id: 'estado',
    label: i18n.t('pedidos.columnsList.estado'),
    render: (row) => <StatusChip status={row.estado} />,
  },
  {
    id: 'usuario',
    label: i18n.t('pedidos.columnsList.creadoPor'),
    render: (row) => getPedidoCreatorName(row),
    hideOnMobile: true,
  },
];

/**
 * Construye batch columns a partir de los parámetros recibidos.
 * @returns Valor resultante de la operación.
 */
/**
 * Expone "buildBatchColumns" en smart-economat-frontend (SPA).
 * @undefined {Column<PurchaseBatch>[]} Datos efectivos después de ejecutar la operación.
 */
export const buildBatchColumns = (): Column<PurchaseBatch>[] => [
  {
    id: 'createdAt',
    label: i18n.t('pedidos.columnsList.fechaCreacion'),
    render: (row) => formatPedidoDate(row.createdAt, 'datetime'),
  },
  {
    id: 'pedidos',
    label: i18n.t('pedidos.columnsList.nPedidos'),
    render: (row) => getBatchPedidosCount(row),
  },
  {
    id: 'costeTotal',
    label: i18n.t('pedidos.columnsList.costeTotalEstimado'),
    align: 'right',
    render: (row) => formatCurrency(getBatchTotal(row)),
  },
  {
    id: 'estado',
    label: i18n.t('pedidos.columnsList.estado'),
    render: (row) => <StatusChip status={String(row.estado)} />,
  },
  {
    id: 'usuario',
    label: i18n.t('pedidos.columnsList.creadoPor'),
    render: (row) => row.usuario?.nombre || row.usuario?.username || '—',
  },
];

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
/**
 * Renderiza un árbol React o valores serializados a salida estable.
 * @undefined {PedidoListItem} row - Entrada efectiva esperada por el contrato.
 * @undefined {PedidoPermissions} permissions - Entrada efectiva esperada por el contrato.
 * @undefined {PedidoActionHandlers} handlers - Entrada efectiva esperada por el contrato.
 * @undefined {React.ReactNode} Datos efectivos después de ejecutar la operación.
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
          <Tooltip title={i18n.t('comun.aprobar')}>
            <IconButton
              color="success"
              onClick={() => handlers.onApprove(row)}
              size="small"
              aria-label={i18n.t('comun.aprobar')}
            >
              <CheckIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}

      {permissions.canCancel &&
        isPendingPedidoUsuarioStatus(String(row.estado)) && (
          <Tooltip title={i18n.t('comun.cancelar')}>
            <IconButton
              color="warning"
              onClick={() => handlers.onCancel(row)}
              size="small"
              aria-label={i18n.t('comun.cancelar')}
            >
              <CancelIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}

      {permissions.canEdit &&
        isPendingPedidoUsuarioStatus(String(row.estado)) && (
          <Tooltip title={i18n.t('comun.editar')}>
            <IconButton
              color="secondary"
              onClick={() => handlers.onEdit(row)}
              size="small"
              aria-label={i18n.t('comun.editar')}
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
              {i18n.t('pedidos.columnsList.chipPedidoUsuario')}
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
            {i18n.t('pedidos.columnsList.chipInterno')}
          </Typography>
        }
      />
    </Stack>
  );

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
/**
 * Renderiza un árbol React o valores serializados a salida estable.
 * @undefined {PurchaseBatch} row - Entrada efectiva esperada por el contrato.
 * @undefined {PurchaseBatchActionHandlers} handlers - Entrada efectiva esperada por el contrato.
 * @undefined {React.ReactNode} Datos efectivos después de ejecutar la operación.
 */
export const renderBatchActions = (
  row: PurchaseBatch,
  handlers: PurchaseBatchActionHandlers
): React.ReactNode => (
  <Stack direction="row" spacing={1} justifyContent="center">
    <Tooltip title={i18n.t('comun.iniciarRecepcion')}>
      <IconButton
        color="success"
        onClick={(e) => {
          e.stopPropagation();
          handlers.onRecepcion(row);
        }}
        size="small"
        aria-label={i18n.t('comun.iniciarRecepcion')}
      >
        <LoginOutlinedIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  </Stack>
);

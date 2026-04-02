import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import DataTable from '../../../components/ui/DataTable';
import { Pedido } from '../../../services/pedido.types';
import {
  PedidoActionHandlers,
  PedidoPermissions,
  PedidosViewMode,
} from '../types/pedidos-ui.types';
import {
  buildPedidoColumns,
  renderPedidoActions,
} from '../utils/pedidoColumns';
import { formatPedidoListNumber } from '../utils/pedidoFormatters';
import { isAggregatedBatchPedido } from '../utils/pedidoOwnOrders';
import PedidoCard from './PedidoCard';

interface PedidosTableProps {
  data: Pedido[];
  isLoading: boolean;
  page: number;
  pageSize: number;
  totalPages: number;
  viewMode: PedidosViewMode;
  permissions: PedidoPermissions;
  handlers: PedidoActionHandlers;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onCreateClick: () => void;
  hideCreator?: boolean;
  currentUserId?: string;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
}

const PedidosTable: React.FC<PedidosTableProps> = ({
  data,
  isLoading,
  page,
  pageSize,
  totalPages,
  viewMode,
  permissions,
  handlers,
  onPageChange,
  onPageSizeChange,
  onCreateClick,
  hideCreator = false,
  currentUserId,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
}) => {
  const [sortConfig, setSortConfig] = React.useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === 'asc'
    ) {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const columns = React.useMemo(
    () => buildPedidoColumns({ hideCreator }),
    [hideCreator]
  );

  const sortedData = React.useMemo(() => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      const { key, direction } = sortConfig;
      let valA: string | number | boolean | null | undefined;
      let valB: string | number | boolean | null | undefined;

      switch (key) {
        case 'pedidoId':
          valA = a.numeroGlobal || a.id;
          valB = b.numeroGlobal || b.id;
          break;
        case 'fechaPedido':
          valA = a.fechaPedido ? new Date(a.fechaPedido).getTime() : 0;
          valB = b.fechaPedido ? new Date(b.fechaPedido).getTime() : 0;
          break;
        case 'fechaEntrega':
          valA = a.fechaEntrega ? new Date(a.fechaEntrega).getTime() : 0;
          valB = b.fechaEntrega ? new Date(b.fechaEntrega).getTime() : 0;
          break;
        case 'costeTotal':
          valA = a.costeTotal || 0;
          valB = b.costeTotal || 0;
          break;
        case 'estado':
          valA = String(a.estado).toLowerCase();
          valB = String(b.estado).toLowerCase();
          break;
        case 'usuario':
          valA = (a.usuario?.nombre || a.usuario?.username || '').toLowerCase();
          valB = (b.usuario?.nombre || b.usuario?.username || '').toLowerCase();
          break;
        default: {
          const aMap = a as unknown as Record<
            string,
            string | number | boolean | null | undefined
          >;
          const bMap = b as unknown as Record<
            string,
            string | number | boolean | null | undefined
          >;
          valA = aMap[key];
          valB = bMap[key];
        }
      }

      if (valA === undefined || valA === null)
        return direction === 'asc' ? -1 : 1;
      if (valB === undefined || valB === null)
        return direction === 'asc' ? 1 : -1;
      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  return (
    <DataTable
      columns={columns}
      data={sortedData}
      isLoading={isLoading}
      hideTopBar
      viewMode={viewMode}
      defaultViewMode={viewMode}
      sortConfig={sortConfig || undefined}
      onSort={handleSort}
      selectable={selectable}
      selectedIds={selectedIds}
      onSelectionChange={onSelectionChange}
      uniqueKey="id"
      renderGridItem={(row) => (
        <PedidoCard
          pedido={row}
          actions={renderPedidoActions(
            row,
            permissions,
            handlers,
            currentUserId
          )}
          onRowClick={handlers.onView}
        />
      )}
      emptyStateMessage={
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <LocalShippingOutlinedIcon
            sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }}
          />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No se encontraron pedidos
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Empieza registrando un nuevo pedido al catálogo de proveedores.
          </Typography>
          {permissions.canCreate && (
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={onCreateClick}
            >
              Registrar Pedido
            </Button>
          )}
        </Box>
      }
      pagination={{
        currentPage: page,
        totalPages,
        onPageChange: (_, newPage) => onPageChange(newPage),
        pageSize,
        pageSizeOptions: [5, 10, 25, 50],
        onPageSizeChange: (event) =>
          onPageSizeChange(Number(event.target.value)),
      }}
      onRowClick={handlers.onView}
      getRowAriaLabel={(row) =>
        isAggregatedBatchPedido(row)
          ? `Ver detalle del pedido ${formatPedidoListNumber(row)}`
          : `Ver detalle del pedido ${formatPedidoListNumber(row)}`
      }
      renderActions={(row) =>
        renderPedidoActions(row, permissions, handlers, currentUserId)
      }
    />
  );
};

export default PedidosTable;

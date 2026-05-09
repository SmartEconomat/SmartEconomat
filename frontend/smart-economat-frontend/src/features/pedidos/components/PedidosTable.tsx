import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import DataTable from '../../../components/ui/DataTable';
import {
  DataTablePaginationProps,
  SortConfig,
  type FilterValue,
} from '../../../hooks/useDataTable';
import { PedidoListItem } from '../../../services/pedido.types';
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
import PedidoCard from './PedidoCard';

interface PedidosTableProps {
  data: PedidoListItem[];
  isLoading: boolean;
  viewMode: PedidosViewMode;
  permissions: PedidoPermissions;
  handlers: PedidoActionHandlers;
  onSort: (key: string) => void;
  sortConfig?: SortConfig;
  filters: Record<string, FilterValue>;
  onFilter: (columnId: string, value: FilterValue) => void;
  pagination: DataTablePaginationProps;
  onCreateClick: () => void;
}

const columns = buildPedidoColumns();

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
const PedidosTable: React.FC<PedidosTableProps> = ({
  data,
  isLoading,
  viewMode,
  permissions,
  handlers,
  onSort,
  sortConfig,
  filters,
  onFilter,
  pagination,
  onCreateClick,
}) => {
  return (
    <DataTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      hideTopBar
      viewMode={viewMode}
      defaultViewMode={viewMode}
      onSort={onSort}
      sortConfig={sortConfig}
      filters={filters}
      onFilter={onFilter}
      pagination={{
        ...pagination,
        pageSizeOptions: pagination.pageSizeOptions ?? [5, 10, 15, 20, 50],
      }}
      renderGridItem={(row) => (
        <PedidoCard
          pedido={row}
          actions={renderPedidoActions(row, permissions, handlers)}
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
      onRowClick={handlers.onView}
      getRowAriaLabel={(row) =>
        `Ver detalle del pedido ${formatPedidoListNumber(row)}`
      }
      renderActions={(row) => renderPedidoActions(row, permissions, handlers)}
    />
  );
};

export default PedidosTable;

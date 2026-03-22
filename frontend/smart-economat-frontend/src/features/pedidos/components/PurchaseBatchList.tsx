import React from 'react';
import DataTable from '../../../components/ui/DataTable';
import { PurchaseBatch } from '../../../services/pedido.types';
import { PurchaseBatchActionHandlers } from '../types/pedidos-ui.types';
import { buildBatchColumns } from '../utils/pedidoColumns';
import { formatPedidoId } from '../utils/pedidoFormatters';

interface PurchaseBatchListProps {
  batches: PurchaseBatch[];
  isLoading: boolean;
  isFetchingBatch: boolean;
  handlers: PurchaseBatchActionHandlers;
}

const columns = buildBatchColumns();

const PurchaseBatchList: React.FC<PurchaseBatchListProps> = ({
  batches,
  isLoading,
  handlers,
}) => (
  <DataTable
    columns={columns}
    data={batches}
    isLoading={isLoading}
    hideTopBar
    viewMode="list"
    emptyStateMessage="No hay compras registradas."
    onRowClick={handlers.onView}
    getRowAriaLabel={(row) =>
      `Abrir detalle de la compra ${formatPedidoId(row.id)}`
    }
  />
);

export default PurchaseBatchList;

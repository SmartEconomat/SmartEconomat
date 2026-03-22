import React from 'react';
import DataTable from '../../../components/ui/DataTable';
import { PurchaseBatch } from '../../../services/pedido.types';
import { PurchaseBatchActionHandlers } from '../types/pedidos-ui.types';
import { buildBatchColumns, renderBatchActions } from '../utils/pedidoColumns';

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
  isFetchingBatch,
  handlers,
}) => (
  <DataTable
    columns={columns}
    data={batches}
    isLoading={isLoading}
    hideTopBar
    viewMode="list"
    emptyStateMessage="No hay lotes de compra registrados."
    renderActions={(row) => renderBatchActions(row, handlers, isFetchingBatch)}
  />
);

export default PurchaseBatchList;

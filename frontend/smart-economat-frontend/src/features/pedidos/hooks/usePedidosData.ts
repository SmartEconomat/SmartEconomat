import { useCallback, useEffect, useState } from 'react';
import {
  fetchPedidos,
  fetchPurchaseBatches,
} from '../../../services/pedido.service';
import {
  EstadoPedido,
  Pedido,
  PurchaseBatch,
} from '../../../services/pedido.types';
import { fetchProveedores } from '../../../services/proveedor.service';
import { PedidosTabValue } from '../types/pedidos-ui.types';

interface UsePedidosDataParams {
  page: number;
  pageSize: number;
  searchTerm: string;
  tabIndex: PedidosTabValue;
}

export function usePedidosData({
  page,
  pageSize,
  searchTerm,
  tabIndex,
}: UsePedidosDataParams) {
  const [data, setData] = useState<Pedido[]>([]);
  const [batches, setBatches] = useState<PurchaseBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (tabIndex === 2) {
        const batchesData = await fetchPurchaseBatches();
        setBatches(batchesData);
        setTotalItems(batchesData.length);
        setTotalPages(1);
        return;
      }

      const estadoFilter =
        tabIndex === 0
          ? EstadoPedido.PENDIENTE
          : `NOT_${EstadoPedido.PENDIENTE}`;

      const [pedidosResponse] = await Promise.all([
        fetchPedidos(page, pageSize, searchTerm, estadoFilter),
        fetchProveedores(1, 50).catch(() => ({ data: [] })),
      ]);

      setData(pedidosResponse.data);
      setTotalItems(pedidosResponse.total);
      setTotalPages(pedidosResponse.totalPages);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Error desconocido al cargar pedidos.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, searchTerm, tabIndex]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  return {
    data,
    batches,
    isLoading,
    error,
    totalPages,
    totalItems,
    reload: loadData,
    setData,
    setBatches,
  };
}

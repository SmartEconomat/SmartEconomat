import { useCallback, useEffect, useState } from 'react';
import {
  FetchPedidoUsuariosOptions,
  fetchPurchaseBatches,
  fetchPedidoUsuarios,
  mapPedidoUsuarioToVisibleRow,
} from '../../../services/pedido.service';
import {
  EstadoPedidoUsuario,
  PedidoListItem,
  PurchaseBatch,
} from '../../../services/pedido.types';
import {
  MisPedidosStatusFilter,
  PedidosTabValue,
} from '../types/pedidos-ui.types';

interface UsePedidosDataParams {
  page: number;
  pageSize: number;
  searchTerm: string;
  tabIndex: PedidosTabValue;
  currentUserId?: string;
  misPedidosStatus: MisPedidosStatusFilter;
}

export function usePedidosData({
  page,
  pageSize,
  searchTerm,
  tabIndex,
  currentUserId,
  misPedidosStatus,
}: UsePedidosDataParams) {
  const [data, setData] = useState<PedidoListItem[]>([]);
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

      const pedidoOptions: FetchPedidoUsuariosOptions = {
        sortBy: 'fechaPedido',
        order: 'DESC',
      };

      if (tabIndex === 0 && currentUserId) {
        pedidoOptions.usuarioId = currentUserId;
      }

      if (tabIndex === 1) {
        pedidoOptions.sortBy = 'fechaPedido';
      }

      const effectivePageSize = tabIndex === 1 ? 50 : pageSize;
      const effectivePage = page;
      const estadoFilter =
        tabIndex !== 0
          ? ''
          : misPedidosStatus === 'pendientes'
            ? EstadoPedidoUsuario.PENDIENTE
            : misPedidosStatus === 'activos'
              ? [
                  EstadoPedidoUsuario.APROBADO,
                  EstadoPedidoUsuario.CONSOLIDADO,
                ].join(',')
              : EstadoPedidoUsuario.CANCELADO;

      const pedidosResponse = await fetchPedidoUsuarios(
        effectivePage,
        effectivePageSize,
        searchTerm,
        estadoFilter,
        pedidoOptions
      );

      setData(pedidosResponse.data.map(mapPedidoUsuarioToVisibleRow));
      setTotalItems(pedidosResponse.total);
      setTotalPages(tabIndex === 1 ? 1 : pedidosResponse.totalPages);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Error desconocido al cargar pedidos.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, misPedidosStatus, page, pageSize, searchTerm, tabIndex]);

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

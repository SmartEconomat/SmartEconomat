import { useCallback, useEffect, useState } from 'react';
import {
  FetchPedidoUsuariosOptions,
  fetchPurchaseBatches,
  fetchPedidoUsuarios,
  mapPedidoUsuarioToPedidoRow,
} from '../../../services/pedido.service';
import {
  EstadoPedido,
  Pedido,
  PurchaseBatch,
} from '../../../services/pedido.types';
import { fetchProveedores } from '../../../services/proveedor.service';
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

      const effectivePageSize =
        tabIndex === 1 || tabIndex === 0 ? 50 : pageSize;
      const effectivePage = tabIndex === 0 ? 1 : page;
      const estadoFilter =
        tabIndex === 1
          ? EstadoPedido.PENDIENTE
          : tabIndex === 0
            ? ''
            : misPedidosStatus === 'pendientes'
              ? EstadoPedido.PENDIENTE
              : misPedidosStatus === 'en_proceso'
                ? EstadoPedido.EN_PROCESO
                : [EstadoPedido.ENTREGADO, EstadoPedido.CANCELADO].join(',');

      const [pedidosResponse] = await Promise.all([
        fetchPedidoUsuarios(
          effectivePage,
          effectivePageSize,
          searchTerm,
          estadoFilter,
          pedidoOptions
        ),
        fetchProveedores(1, 50).catch(() => ({ data: [] })),
      ]);

      if (tabIndex === 0 && pedidosResponse.totalPages > 1) {
        const remainingPages = await Promise.all(
          Array.from({ length: pedidosResponse.totalPages - 1 }, (_, index) =>
            fetchPedidoUsuarios(
              index + 2,
              effectivePageSize,
              searchTerm,
              estadoFilter,
              pedidoOptions
            )
          )
        );

        const mergedData = [
          ...pedidosResponse.data,
          ...remainingPages.flatMap((response) => response.data),
        ];

        setData(mergedData.map(mapPedidoUsuarioToPedidoRow));
        setTotalItems(mergedData.length);
        setTotalPages(1);
        return;
      }

      setData(pedidosResponse.data.map(mapPedidoUsuarioToPedidoRow));
      setTotalItems(pedidosResponse.total);
      setTotalPages(
        tabIndex === 1 || tabIndex === 0 ? 1 : pedidosResponse.totalPages
      );
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

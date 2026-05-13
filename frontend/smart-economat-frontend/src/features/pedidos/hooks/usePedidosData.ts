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

const WEEKLY_PEDIDOS_PAGE_SIZE = 50;

type FetchPedidoUsuariosResponse = Awaited<
  ReturnType<typeof fetchPedidoUsuarios>
>;

const mergeUniquePedidoUsuarios = (
  responses: FetchPedidoUsuariosResponse[]
): FetchPedidoUsuariosResponse['data'] => {
  const uniqueById = new Map<
    string,
    FetchPedidoUsuariosResponse['data'][number]
  >();

  responses.forEach((response) => {
    response.data.forEach((pedidoUsuario) => {
      uniqueById.set(pedidoUsuario.id, pedidoUsuario);
    });
  });

  return Array.from(uniqueById.values());
};

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
/**
 * Expone "usePedidosData" en smart-economat-frontend (SPA).
 * @undefined {UsePedidosDataParams} {
 *   page,
 *   pageSize,
 *   searchTerm,
 *   tabIndex,
 *   currentUserId,
 *   misPedidosStatus,
 * } - Entrada efectiva esperada por el contrato.
 * @undefined {{ data: PedidoListItem[]; batches: PurchaseBatch[]; isLoading: boolean; error: string | null; totalPages: number; totalItems: number; reload: () => Promise<void>; setData: import("/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/node_modules/@types/react/index").Dispatch<import("/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/node_modules/@types/react/index").SetStateAction<PedidoListItem[]>>; setBatches: import("/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/node_modules/@types/react/index").Dispatch<import("/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/node_modules/@types/react/index").SetStateAction<PurchaseBatch[]>>; }} Datos efectivos después de ejecutar la operación.
 */
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
    // Limpiamos el error inmediatamente para cumplir con la regla de NO mostrar error durante carga
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
        const firstWeeklyPage = await fetchPedidoUsuarios(
          1,
          WEEKLY_PEDIDOS_PAGE_SIZE,
          searchTerm,
          '',
          pedidoOptions
        );

        const weeklyResponses: FetchPedidoUsuariosResponse[] = [
          firstWeeklyPage,
        ];

        if (firstWeeklyPage.totalPages > 1) {
          const remainingWeeklyPages = await Promise.all(
            Array.from({ length: firstWeeklyPage.totalPages - 1 }, (_, index) =>
              fetchPedidoUsuarios(
                index + 2,
                WEEKLY_PEDIDOS_PAGE_SIZE,
                searchTerm,
                '',
                pedidoOptions
              )
            )
          );

          weeklyResponses.push(...remainingWeeklyPages);
        }

        const weeklyData = mergeUniquePedidoUsuarios(weeklyResponses);

        setData(weeklyData.map(mapPedidoUsuarioToVisibleRow));
        setTotalItems(weeklyData.length);
        setTotalPages(1);
        setError(null);
        return;
      }

      const estadoFilter =
        misPedidosStatus === 'pendientes'
          ? EstadoPedidoUsuario.PENDIENTE
          : misPedidosStatus === 'activos'
            ? EstadoPedidoUsuario.APROBADO
            : '';

      const pedidosResponse = await fetchPedidoUsuarios(
        page,
        pageSize,
        searchTerm,
        estadoFilter,
        pedidoOptions
      );

      setData(pedidosResponse.data.map(mapPedidoUsuarioToVisibleRow));
      setTotalItems(pedidosResponse.total);
      setTotalPages(pedidosResponse.totalPages);
      // Éxito: aseguramos que el error sea nulo
      setError(null);
    } catch (err: unknown) {
      // Solo establecemos el error si la carga falló definitivamente
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

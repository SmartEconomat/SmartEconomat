import { useCallback, useState } from 'react';
import {
  aceptarPedido,
  cancelPedido,
  createPedido,
  createPurchaseBatch,
  fetchPurchaseBatchById,
  updatePedido,
} from '../../../services/pedido.service';
import { ApiError, deleteResource } from '../../../services/api.service';
import { PurchaseBatch } from '../../../services/pedido.types';
import { useToast } from '../../../store/toast.hooks';
import { PedidoFormValues } from '../types/pedidos-ui.types';
import {
  buildCreatePedidoPayload,
  buildPedidoUpdatePayload,
  buildPurchaseBatchPayload,
  extractPedidoLines,
  groupPedidoLinesByProvider,
} from '../utils/pedidoPayloads';

interface UsePedidoActionsParams {
  reload: () => Promise<void>;
  discardDraft: () => Promise<void>;
  onPedidoDeleted?: (id: string) => void;
}

export function usePedidoActions({
  reload,
  discardDraft,
  onPedidoDeleted,
}: UsePedidoActionsParams) {
  const toast = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAceptando, setIsAceptando] = useState(false);
  const [isCancelando, setIsCancelando] = useState(false);
  const [isFetchingBatch, setIsFetchingBatch] = useState(false);

  const savePedido = useCallback(
    async (formData: PedidoFormValues) => {
      setIsSaving(true);
      try {
        const normalizedLines = extractPedidoLines(formData);
        if (normalizedLines.length === 0) {
          throw new Error(
            'Cada línea debe tener un producto-proveedor y una cantidad mayor que 0.'
          );
        }

        const linesByProvider = groupPedidoLinesByProvider(
          normalizedLines,
          formData.proveedorId
        );

        if (
          Array.from(linesByProvider.keys()).some((providerId) => !providerId)
        ) {
          throw new Error(
            'Ocurrió un error al identificar el proveedor de algunos productos.'
          );
        }

        if (formData.id) {
          const mainProviderId = formData.proveedorId || '';
          const mainProviderLines = linesByProvider.get(mainProviderId);

          if (!mainProviderLines) {
            throw new Error(
              'Debes mantener al menos un producto del proveedor original del pedido.'
            );
          }

          await updatePedido(
            formData.id,
            buildPedidoUpdatePayload(
              mainProviderId,
              formData.observaciones,
              mainProviderLines
            )
          );

          linesByProvider.delete(mainProviderId);

          for (const [providerId, lines] of Array.from(
            linesByProvider.entries()
          )) {
            await createPedido(
              buildCreatePedidoPayload(
                providerId,
                formData.observaciones,
                lines
              )
            );
          }

          toast.success(
            linesByProvider.size > 0
              ? 'Pedido actualizado y dividido por proveedor cuando ha sido necesario.'
              : 'Pedido actualizado correctamente.'
          );
        } else {
          await createPurchaseBatch(
            buildPurchaseBatchPayload(formData.observaciones, normalizedLines)
          );

          toast.success(
            linesByProvider.size > 1
              ? `Se ha registrado el lote de compra con ${linesByProvider.size} pedidos agrupados.`
              : 'Pedido registrado correctamente.'
          );
          await discardDraft();
        }

        await reload();
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Error al guardar el pedido.';
        toast.error(message);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [discardDraft, reload, toast]
  );

  const deletePedidoById = useCallback(
    async (id: string) => {
      setIsDeleting(true);
      try {
        await deleteResource(`/pedidos/${id}`);
        onPedidoDeleted?.(id);
        toast.success('Pedido eliminado correctamente.');
        await reload();
      } catch (err: unknown) {
        const isNotFoundError =
          (err instanceof ApiError && err.status === 404) ||
          (err instanceof Error &&
            /pedido no encontrado|order not found/i.test(err.message));

        if (isNotFoundError) {
          onPedidoDeleted?.(id);
          toast.info('El pedido ya no existía. Se ha actualizado la lista.');
          await reload();
          return;
        }

        toast.error(
          err instanceof Error ? err.message : 'Error al eliminar el pedido.'
        );
        throw err;
      } finally {
        setIsDeleting(false);
      }
    },
    [onPedidoDeleted, reload, toast]
  );

  const approvePedidoById = useCallback(
    async (id: string) => {
      setIsAceptando(true);
      try {
        await aceptarPedido(id);
        toast.success('El pedido ha sido aceptado y ahora está en proceso.');
        await reload();
      } catch (err: unknown) {
        toast.error(
          err instanceof Error ? err.message : 'Error al aceptar el pedido.'
        );
        throw err;
      } finally {
        setIsAceptando(false);
      }
    },
    [reload, toast]
  );

  const cancelPedidoById = useCallback(
    async (id: string, motivoCancelacion: string) => {
      setIsCancelando(true);
      try {
        await cancelPedido(id, {
          motivoCancelacion: motivoCancelacion || 'Cancelado por el usuario',
        });
        toast.success('El pedido ha sido cancelado.');
        await reload();
      } catch (err: unknown) {
        toast.error(
          err instanceof Error ? err.message : 'Error al cancelar el pedido.'
        );
        throw err;
      } finally {
        setIsCancelando(false);
      }
    },
    [reload, toast]
  );

  const fetchBatchDetail = useCallback(
    async (id: string): Promise<PurchaseBatch> => {
      setIsFetchingBatch(true);
      try {
        return await fetchPurchaseBatchById(id);
      } catch (err: unknown) {
        toast.error(
          err instanceof Error ? err.message : 'Error al cargar el lote.'
        );
        throw err;
      } finally {
        setIsFetchingBatch(false);
      }
    },
    [toast]
  );

  return {
    savePedido,
    deletePedidoById,
    approvePedidoById,
    cancelPedidoById,
    fetchBatchDetail,
    isSaving,
    isDeleting,
    isAceptando,
    isCancelando,
    isFetchingBatch,
  };
}

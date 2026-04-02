import { useCallback, useState } from 'react';
import {
  aceptarPedidoUsuario,
  aceptarPedido,
  cancelPedidoUsuario,
  cancelPedido,
  consolidatePurchaseBatch,
  createPedido,
  createPedidoUsuario,
  fetchPurchaseBatchById,
  fetchPedidoUsuarioById,
  updatePedidoUsuario,
  updatePedido,
  restaurarPedido,
  restaurarPedidoUsuario,
  restaurarPurchaseBatch,
  tramitarPurchaseBatch,
  deletePedidoUsuario,
} from '../../../services/pedido.service';
import { confirmDistribucion } from '../../../services/distribucion.service';
import { saveRecepcionDraft } from '../../../services/recepcionDraft.service';
import { ApiError, deleteResource } from '../../../services/api.service';
import { useNavigate } from 'react-router-dom';
import { mapPurchaseBatchToRecepcionDraft } from '../../recepcion/utils/recepcionMapping.utils';
import {
  Pedido,
  PedidoUsuario,
  PurchaseBatch,
} from '../../../services/pedido.types';
import { Distribucion } from '../../../services/distribucion.types';
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
  onBatchCreated?: (batch: PurchaseBatch) => void;
}

export function usePedidoActions({
  reload,
  discardDraft,
  onPedidoDeleted,
  onBatchCreated,
}: UsePedidoActionsParams) {
  const toast = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAceptando, setIsAceptando] = useState(false);
  const [isCancelando, setIsCancelando] = useState(false);
  const [isFetchingBatch, setIsFetchingBatch] = useState(false);
  const [isConsolidatingBatch, setIsConsolidatingBatch] = useState(false);
  const navigate = useNavigate();

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

        if (formData.isBatchAggregate && formData.batchId) {
          await updatePedidoUsuario(
            formData.batchId,
            buildPurchaseBatchPayload(formData.observaciones, normalizedLines)
          );

          toast.success('Pedido actualizado correctamente.');
          await reload();
          return;
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
          await createPedidoUsuario(
            buildPurchaseBatchPayload(formData.observaciones, normalizedLines)
          );

          toast.success(
            linesByProvider.size > 1
              ? `Se ha registrado el pedido con ${normalizedLines.length} líneas y separación interna por proveedor.`
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

  const deletePedidoUsuarioById = useCallback(
    async (id: string) => {
      setIsDeleting(true);
      try {
        await deletePedidoUsuario(id);
        onPedidoDeleted?.(id);
        toast.success('Pedido eliminado correctamente.');
        await reload();
      } catch (err: unknown) {
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

  const approvePurchaseBatchById = useCallback(
    async (id: string) => {
      setIsAceptando(true);
      try {
        await aceptarPedidoUsuario(id);
        toast.success('El pedido ha sido aprobado y ahora está en proceso.');
        await reload();
      } catch (err: unknown) {
        toast.error(
          err instanceof Error ? err.message : 'Error al aprobar el pedido.'
        );
        throw err;
      } finally {
        setIsAceptando(false);
      }
    },
    [reload, toast]
  );

  const tramitarPurchaseBatchById = useCallback(
    async (id: string) => {
      setIsAceptando(true);
      try {
        await tramitarPurchaseBatch(id);
        toast.success('El lote ha sido marcado como "Pedido a Proveedor".');
        await reload();
      } catch (err: unknown) {
        toast.error(
          err instanceof Error ? err.message : 'Error al tramitar el lote.'
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

  const cancelPurchaseBatchById = useCallback(
    async (id: string, motivoCancelacion: string) => {
      setIsCancelando(true);
      try {
        await cancelPedidoUsuario(id, {
          motivoCancelacion: motivoCancelacion || 'Cancelado por el usuario',
        });
        toast.success('El pedido a sido cancelado.');
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
    async (
      id: string,
      aggregateType?: 'pedido_usuario'
    ): Promise<PurchaseBatch | PedidoUsuario> => {
      setIsFetchingBatch(true);
      try {
        if (aggregateType === 'pedido_usuario') {
          return await fetchPedidoUsuarioById(id);
        }

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

  const consolidatePedidosByIds = useCallback(
    async (pedidoIds: string[], observaciones?: string) => {
      setIsConsolidatingBatch(true);
      try {
        const batch = await consolidatePurchaseBatch({
          pedidoIds: pedidoIds,
          observaciones,
        });
        toast.success('Se ha generado el lote semanal correctamente.');
        onBatchCreated?.(batch);
        await reload();
        return batch;
      } catch (err: unknown) {
        toast.error(
          err instanceof Error
            ? err.message
            : 'Error al consolidar pedidos en un lote.'
        );
        throw err;
      } finally {
        setIsConsolidatingBatch(false);
      }
    },
    [onBatchCreated, reload, toast]
  );

  const startRecepcionFromBatch = useCallback(
    async (batch: PurchaseBatch) => {
      try {
        const draft = mapPurchaseBatchToRecepcionDraft(batch);
        await saveRecepcionDraft(draft);
        navigate('/recepcion');
        toast.success(
          'Se ha iniciado la recepción con los productos de la compra.'
        );
      } catch (err: unknown) {
        toast.error(
          err instanceof Error
            ? err.message
            : 'Error al iniciar la recepción desde la compra.'
        );
      }
    },
    [navigate, toast]
  );

  const restorePedidoById = useCallback(
    async (id: string) => {
      setIsSaving(true);
      try {
        await restaurarPedido(id);
        toast.success('Pedido restaurado correctamente.');
        await reload();
      } catch (err: unknown) {
        toast.error(
          err instanceof Error ? err.message : 'Error al restaurar el pedido.'
        );
      } finally {
        setIsSaving(false);
      }
    },
    [reload, toast]
  );

  const restorePurchaseBatchById = useCallback(
    async (id: string, isPedidoUsuario = false) => {
      setIsSaving(true);
      try {
        if (isPedidoUsuario) {
          await restaurarPedidoUsuario(id);
        } else {
          await restaurarPurchaseBatch(id);
        }
        toast.success('Pedido restaurado correctamente.');
        await reload();
      } catch (err: unknown) {
        toast.error(
          err instanceof Error ? err.message : 'Error al restaurar el pedido.'
        );
      } finally {
        setIsSaving(false);
      }
    },
    [reload, toast]
  );

  const confirmReceipt = useCallback(
    async (pedido: Pedido) => {
      const distribucionPendiente = pedido.distribuciones?.find(
        (d: Distribucion) => d.estado === 'preparada'
      );

      if (!distribucionPendiente) {
        toast.error('No se encontró una entrega pendiente de recoger.');
        return;
      }

      setIsAceptando(true);
      try {
        await confirmDistribucion(distribucionPendiente.id);
        toast.success('Recepción confirmada correctamente.');
        await reload();
      } catch (err: unknown) {
        toast.error(
          err instanceof Error
            ? err.message
            : 'Error al confirmar la recepción.'
        );
      } finally {
        setIsAceptando(false);
      }
    },
    [reload, toast]
  );

  return {
    savePedido,
    deletePedidoById,
    deletePedidoUsuarioById,
    approvePedidoById,
    approvePurchaseBatchById,
    cancelPedidoById,
    cancelPurchaseBatchById,
    setIsConsolidatingBatch,
    fetchBatchDetail,
    consolidatePedidosByIds,
    startRecepcionFromBatch,
    restorePedidoById,
    restorePurchaseBatchById,
    onConfirmReceipt: confirmReceipt,
    onTramitar: (batch: PurchaseBatch) => tramitarPurchaseBatchById(batch.id),
    isSaving,
    isDeleting,
    isAceptando,
    isCancelando,
    isFetchingBatch,
    isConsolidatingBatch,
  };
}

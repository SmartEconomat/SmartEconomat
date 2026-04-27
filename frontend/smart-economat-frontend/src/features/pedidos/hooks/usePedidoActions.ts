import { useCallback, useState } from 'react';
import {
  aceptarPedidoUsuario,
  aceptarPurchaseBatch,
  cancelPedidoUsuario,
  cancelPurchaseBatch,
  consolidatePurchaseBatch,
  createPedido,
  createPedidoUsuario,
  fetchPurchaseBatchById,
  fetchPedidoUsuarioById,
  updatePurchaseBatch,
  updatePedidoUsuario,
  updatePedido,
} from '../../../services/pedido.service';
import { saveRecepcionDraft } from '../../../services/recepcionDraft.service';
import { ApiError, deleteResource } from '../../../services/api.service';
import { useNavigate } from 'react-router-dom';
import { mapPurchaseBatchToRecepcionDraft } from '../../recepcion/utils/recepcionMapping.utils';
import {
  PedidoBatchDetail,
  PedidoDetailEntityType,
  PurchaseBatch,
} from '../../../services/pedido.types';
import { useToast } from '../../../store/toast.hooks';
import { useTranslation } from 'react-i18next';
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

/**
 * Documentación en español.
 */
export function usePedidoActions({
  reload,
  discardDraft,
  onPedidoDeleted,
  onBatchCreated,
}: UsePedidoActionsParams) {
  const { t } = useTranslation();
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
        const targetType = formData.targetType ?? 'pedido_usuario';

        if (normalizedLines.length === 0) {
          throw new Error(t('pedidos.errors.sinProductos'));
        }

        const linesByProvider = groupPedidoLinesByProvider(
          normalizedLines,
          formData.proveedorId
        );

        if (
          Array.from(linesByProvider.keys()).some((providerId) => !providerId)
        ) {
          throw new Error(t('pedidos.errors.errorIdentificarProveedor'));
        }

        if (formData.id && targetType === 'purchase_batch') {
          await updatePurchaseBatch(
            formData.id,
            buildPurchaseBatchPayload(formData.observaciones, normalizedLines)
          );

          toast.success(t('pedidos.toast.compraActualizada'));
          await reload();
          return;
        }

        if (formData.id && targetType === 'pedido_usuario') {
          await updatePedidoUsuario(
            formData.id,
            buildPurchaseBatchPayload(formData.observaciones, normalizedLines)
          );

          toast.success(t('pedidos.toast.pedidoActualizado'));
          await reload();
          return;
        }

        if (formData.id) {
          const mainProviderId = formData.proveedorId || '';
          const mainProviderLines = linesByProvider.get(mainProviderId);

          if (!mainProviderLines) {
            throw new Error(t('pedidos.errors.mantenerProductoProveedor'));
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
              ? t('pedidos.toast.pedidoActualizadoDividido')
              : t('pedidos.toast.pedidoActualizado')
          );
        } else {
          await createPedidoUsuario(
            buildPurchaseBatchPayload(formData.observaciones, normalizedLines)
          );

          toast.success(
            linesByProvider.size > 1
              ? t('pedidos.toast.pedidoRegistradoMultiproveedor', {
                  count: normalizedLines.length,
                })
              : t('pedidos.toast.pedidoRegistrado')
          );
          await discardDraft();
        }

        await reload();
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : t('pedidos.errors.errorGuardar');
        toast.error(message);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [discardDraft, reload, toast, t]
  );

  const deletePedidoById = useCallback(
    async (id: string) => {
      setIsDeleting(true);
      try {
        await deleteResource(`/pedidos/${id}`);
        onPedidoDeleted?.(id);
        toast.success(t('pedidos.toast.pedidoEliminado'));
        await reload();
      } catch (err: unknown) {
        const isNotFoundError =
          (err instanceof ApiError && err.status === 404) ||
          (err instanceof Error &&
            /pedido no encontrado|order not found/i.test(err.message));

        if (isNotFoundError) {
          onPedidoDeleted?.(id);
          toast.info(t('pedidos.toast.pedidoYaNoExistia'));
          await reload();
          return;
        }

        toast.error(
          err instanceof Error ? err.message : t('pedidos.errors.errorEliminar')
        );
        throw err;
      } finally {
        setIsDeleting(false);
      }
    },
    [onPedidoDeleted, reload, toast, t]
  );

  const approvePedidoById = useCallback(
    async (id: string) => {
      setIsAceptando(true);
      try {
        await aceptarPedidoUsuario(id);
        toast.success(t('pedidos.toast.pedidoAprobado'));
        await reload();
      } catch (err: unknown) {
        toast.error(
          err instanceof Error ? err.message : t('pedidos.errors.errorAprobar')
        );
        throw err;
      } finally {
        setIsAceptando(false);
      }
    },
    [reload, toast, t]
  );

  const approvePurchaseBatchById = useCallback(
    async (id: string) => {
      setIsAceptando(true);
      try {
        await aceptarPurchaseBatch(id);
        toast.success(t('pedidos.toast.compraTramitada'));
        await reload();
      } catch (err: unknown) {
        toast.error(
          err instanceof Error
            ? err.message
            : t('pedidos.errors.errorAprobarCompra')
        );
        throw err;
      } finally {
        setIsAceptando(false);
      }
    },
    [reload, toast, t]
  );

  const cancelPedidoById = useCallback(
    async (id: string, motivoCancelacion: string) => {
      setIsCancelando(true);
      try {
        await cancelPedidoUsuario(id, {
          motivoCancelacion:
            motivoCancelacion || t('pedidos.cancelar.motivoPorDefecto'),
        });
        toast.success(t('pedidos.toast.pedidoCancelado'));
        await reload();
      } catch (err: unknown) {
        toast.error(
          err instanceof Error ? err.message : t('pedidos.errors.errorCancelar')
        );
        throw err;
      } finally {
        setIsCancelando(false);
      }
    },
    [reload, toast, t]
  );

  const cancelPurchaseBatchById = useCallback(
    async (id: string, motivoCancelacion: string) => {
      setIsCancelando(true);
      try {
        await cancelPurchaseBatch(id, {
          motivoCancelacion:
            motivoCancelacion || t('pedidos.cancelar.motivoPorDefecto'),
        });
        toast.success(t('pedidos.toast.compraCancelada'));
        await reload();
      } catch (err: unknown) {
        toast.error(
          err instanceof Error
            ? err.message
            : t('pedidos.errors.errorCancelarCompra')
        );
        throw err;
      } finally {
        setIsCancelando(false);
      }
    },
    [reload, toast, t]
  );

  const fetchBatchDetail = useCallback(
    async (
      id: string,
      entityType: PedidoDetailEntityType
    ): Promise<PedidoBatchDetail> => {
      setIsFetchingBatch(true);
      try {
        if (entityType === 'pedido_usuario') {
          return {
            entityType,
            data: await fetchPedidoUsuarioById(id),
          };
        }

        return {
          entityType,
          data: await fetchPurchaseBatchById(id),
        };
      } catch (err: unknown) {
        toast.error(
          err instanceof Error
            ? err.message
            : t('pedidos.errors.errorCargarLote')
        );
        throw err;
      } finally {
        setIsFetchingBatch(false);
      }
    },
    [toast, t]
  );

  const consolidatePedidosByIds = useCallback(
    async (pedidoUsuarioIds: string[], observaciones?: string) => {
      setIsConsolidatingBatch(true);
      try {
        const batch = await consolidatePurchaseBatch({
          pedidoUsuarioIds,
          observaciones,
        });
        toast.success(t('pedidos.toast.loteSemanalGenerado'));
        onBatchCreated?.(batch);
        await reload();
        return batch;
      } catch (err: unknown) {
        toast.error(
          err instanceof Error
            ? err.message
            : t('pedidos.errors.errorConsolidar')
        );
        throw err;
      } finally {
        setIsConsolidatingBatch(false);
      }
    },
    [onBatchCreated, reload, toast, t]
  );

  const startRecepcionFromBatch = useCallback(
    async (batch: PurchaseBatch) => {
      try {
        const draft = mapPurchaseBatchToRecepcionDraft(batch);

        if ((draft.pedidosSeleccionados || []).length === 0) {
          toast.info(t('pedidos.toast.sinPedidosRecepcionar'));
          return;
        }

        await saveRecepcionDraft(draft);
        navigate('/recepciones', {
          state: {
            autoResumeRecepcionDraft: true,
          },
        });
        toast.success(t('pedidos.toast.recepcionIniciada'));
      } catch (err: unknown) {
        toast.error(
          err instanceof Error
            ? err.message
            : t('pedidos.errors.errorIniciarRecepcion')
        );
      }
    },
    [navigate, toast, t]
  );

  return {
    savePedido,
    deletePedidoById,
    approvePedidoById,
    approvePurchaseBatchById,
    cancelPedidoById,
    cancelPurchaseBatchById,
    fetchBatchDetail,
    consolidatePedidosByIds,
    startRecepcionFromBatch,
    isSaving,
    isDeleting,
    isAceptando,
    isCancelando,
    isFetchingBatch,
    isConsolidatingBatch,
  };
}

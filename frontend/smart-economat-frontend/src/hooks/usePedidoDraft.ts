import { useState, useEffect, useCallback, useRef } from 'react';
import {
  upsertPedidoDraft,
  fetchLatestPedidoDraft,
  deletePedidoDraft,
  PedidoDraftRecord,
} from '../services/pedidoDraft.service';

/**
 * Hook para la gestión persistente de borradores de pedidos a proveedores.
 * Permite guardar y recuperar el estado de un pedido en construcción para evitar pérdida de datos.
 */
export function usePedidoDraft() {
  const [draft, _setDraft] = useState<PedidoDraftRecord | null>(null);
  const draftRef = useRef<PedidoDraftRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [saveError, setSaveError] = useState<Error | null>(null);
  const lastSavedPayloadRef = useRef<string>('');

  const setDraft = useCallback((d: PedidoDraftRecord | null) => {
    _setDraft(d);
    draftRef.current = d;
  }, []);

  const loadDraft = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchLatestPedidoDraft();
      setDraft(data);
      if (data) {
        lastSavedPayloadRef.current = JSON.stringify(data.payload);
      }
    } catch (error) {
      console.error('Error loading pedido draft:', error);
    } finally {
      setIsLoading(false);
    }
  }, [setDraft]);

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const flushSave = useCallback(
    async (payload: Record<string, unknown>) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      const payloadStr = JSON.stringify(payload);
      if (payloadStr === lastSavedPayloadRef.current) return;

      try {
        const updated = await upsertPedidoDraft(
          payload,
          draftRef.current?.version
        );
        setDraft(updated);
        lastSavedPayloadRef.current = payloadStr;
      } catch (error: unknown) {
        const err = error as {
          status?: number;
          data?: { draft: PedidoDraftRecord };
        };
        if (err?.status === 409 && err?.data?.draft) {
          setDraft(err.data.draft);
        } else {
          const autosaveErr = new Error(
            'Error al guardar borrador automáticamente'
          );
          setSaveError(autosaveErr);
          console.error('Error flushing pedido draft:', error);
        }
      }
    },
    [setDraft]
  );

  const saveDraft = useCallback(
    async (payload: Record<string, unknown>) => {
      const payloadStr = JSON.stringify(payload);
      if (payloadStr === lastSavedPayloadRef.current) return;

      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

      saveTimerRef.current = setTimeout(async () => {
        try {
          const updated = await upsertPedidoDraft(
            payload,
            draftRef.current?.version
          );
          setDraft(updated);
          lastSavedPayloadRef.current = payloadStr;
        } catch (error: unknown) {
          const err = error as {
            status?: number;
            data?: { draft: PedidoDraftRecord };
          };
          if (err?.status === 409 && err?.data?.draft) {
            setDraft(err.data.draft);
          } else {
            const autosaveErr = new Error(
              'Error al guardar borrador automáticamente'
            );
            setSaveError(autosaveErr);
            console.error('Error saving pedido draft:', error);
          }
        }
      }, 1000); // 1 segundo
    },
    [setDraft]
  );

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const discardDraft = useCallback(async () => {
    const previousDraft = draftRef.current;
    const previousPayload = lastSavedPayloadRef.current;

    setDraft(null);
    lastSavedPayloadRef.current = '';

    try {
      await deletePedidoDraft();
    } catch (error) {
      setDraft(previousDraft);
      lastSavedPayloadRef.current = previousPayload;
      console.error(
        'Error al descartar borrador — restaurando estado anterior:',
        error
      );
      throw error;
    }
  }, [setDraft]);

  return {
    draft,
    loadDraft,
    saveDraft,
    discardDraft,
    flushSave,
    isLoadingDraft: isLoading,
    saveError,
  };
}

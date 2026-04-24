import { useState, useEffect, useCallback, useRef } from 'react';
import {
  upsertPedidoDraft,
  fetchLatestPedidoDraft,
  deletePedidoDraft,
  PedidoDraftRecord,
} from '../services/pedidoDraft.service';

/**
 * Hook for managing a transient pedido draft in the backend.
 *
 * Exposes helpers to load, auto-save (debounced), immediately flush, and
 * discard the draft. The save is debounced by 1 second and skipped when the
 * serialised payload has not changed. Optimistic conflict resolution: on HTTP
 * 409 the server-side draft is used as the new source of truth.
 *
 * @returns
 *   - `draft` — current draft record or `null` if none exists
 *   - `isLoadingDraft` — `true` while `loadDraft` is in flight
 *   - `loadDraft` — fetches the latest draft from the server
 *   - `saveDraft` — debounced save; no-op when payload is unchanged
 *   - `flushSave` — immediate save (bypasses debounce timer)
 *   - `discardDraft` — optimistically clears local state then deletes server draft
 *
 * @example
 * const { draft, loadDraft, saveDraft, discardDraft } = usePedidoDraft();
 * useEffect(() => { void loadDraft(); }, [loadDraft]);
 */
export function usePedidoDraft() {
  const [draft, _setDraft] = useState<PedidoDraftRecord | null>(null);
  const draftRef = useRef<PedidoDraftRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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
    try {
      // Optimista: Limpiar local primero
      setDraft(null);
      lastSavedPayloadRef.current = '';
      await deletePedidoDraft();
    } catch (error) {
      console.error('Error deleting pedido draft:', error);
    }
  }, [setDraft]);

  return {
    draft,
    loadDraft,
    saveDraft,
    discardDraft,
    flushSave,
    isLoadingDraft: isLoading,
  };
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ApiError } from '../services/api.service';
import {
  deleteRecepcionDraft,
  fetchRecepcionDraft,
  saveRecepcionDraft,
} from '../services/recepcionDraft.service';
import {
  RecepcionDraft,
  RecepcionDraftEnvelope,
} from '../services/recepcion.types';
import {
  getRecepcionDraftStepIndex,
  hasRecepcionDraftContent,
  hydrateRecepcionDraft,
} from './useRecepcionDraft.helpers';

type SyncStatus = 'idle' | 'saving' | 'synced' | 'error' | 'conflict';

interface UseRecepcionDraftOptions {
  activeStep: number;
  autoResume?: boolean;
  debounceMs?: number;
  defaultDraft: () => RecepcionDraft;
  setActiveStep: (step: number) => void;
}

interface ConflictPayload {
  remoteDraft: RecepcionDraftEnvelope;
  localDraft: RecepcionDraft;
}

function extractRemoteDraft(error: ApiError): RecepcionDraftEnvelope | null {
  if (!error.payload || typeof error.payload !== 'object') {
    return null;
  }

  const payload = error.payload as {
    error?: { draft?: RecepcionDraftEnvelope };
  };

  return payload.error?.draft ?? null;
}

/**
 * Hook avanzado para la gestión de borradores de recepción con sincronización automática en backend.
 * Incluye gestión de conflictos de versión, recuperación de estados previos (auto-resume)
 * y persistencia optimista durante la navegación.
 *
 * @param {UseRecepcionDraftOptions} options - Configuración del hook (paso activo, debounce, etc.)
 */
/**
 * Expone "useRecepcionDraft" en smart-economat-frontend (SPA).
 * @undefined {UseRecepcionDraftOptions} {
 *   activeStep,
 *   autoResume = false,
 *   debounceMs = 2000,
 *   defaultDraft,
 *   setActiveStep,
 * } - Entrada efectiva esperada por el contrato.
 * @undefined {{ applyPendingRecoveryDraft: () => void; clearDraft: () => Promise<void>; conflict: ConflictPayload | null; draft: RecepcionDraft; isReady: boolean; keepLocalDraft: () => Promise<void>; pendingRecoveryDraft: RecepcionDraftEnvelope | null; setDraft: import("/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/node_modules/@types/react/index").Dispatch<import("/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/node_modules/@types/react/index").SetStateAction<RecepcionDraft>>; syncDraft: (overrideDraft?: RecepcionDraft) => Promise<RecepcionDraftEnvelope | null>; syncError: string | null; syncStatus: SyncStatus; useRemoteDraft: () => void; }} Datos efectivos después de ejecutar la operación.
 */
export function useRecepcionDraft({
  activeStep,
  autoResume = false,
  debounceMs = 2000,
  defaultDraft,
  setActiveStep,
}: UseRecepcionDraftOptions) {
  const [draft, setDraft] = useState<RecepcionDraft>(() => defaultDraft());
  const [pendingRecoveryDraft, setPendingRecoveryDraft] =
    useState<RecepcionDraftEnvelope | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [conflict, setConflict] = useState<ConflictPayload | null>(null);

  const draftRef = useRef(draft);
  const activeStepRef = useRef(activeStep);
  const skipAutoSaveRef = useRef(false);
  const pendingSyncTimerRef = useRef<number | null>(null);
  const isSyncingRef = useRef(false);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    activeStepRef.current = activeStep;
  }, [activeStep]);

  const applyDraftEnvelope = useCallback(
    (envelope: RecepcionDraftEnvelope) => {
      skipAutoSaveRef.current = true;

      const hydrated = hydrateRecepcionDraft(
        envelope.payload,
        envelope,
        defaultDraft()
      );

      setDraft(hydrated);
      setActiveStep(getRecepcionDraftStepIndex(hydrated));
      setPendingRecoveryDraft(null);
      setConflict(null);
      setSyncStatus('synced');
      setSyncError(null);
    },
    [defaultDraft, setActiveStep]
  );

  const syncDraft = useCallback(
    async (
      overrideDraft?: RecepcionDraft
    ): Promise<RecepcionDraftEnvelope | null> => {
      if (activeStepRef.current >= 3) {
        return null;
      }

      if (isSyncingRef.current) {
        return null;
      }

      const candidateDraft = overrideDraft ?? draftRef.current;

      if (
        !hasRecepcionDraftContent(candidateDraft) &&
        candidateDraft.serverVersion == null &&
        !candidateDraft.serverUpdatedAt
      ) {
        setSyncStatus('idle');
        setSyncError(null);
        return null;
      }

      isSyncingRef.current = true;
      setSyncStatus('saving');
      setSyncError(null);

      try {
        const persisted = await saveRecepcionDraft(candidateDraft);
        const hydrated = hydrateRecepcionDraft(
          persisted.payload,
          persisted,
          defaultDraft()
        );
        skipAutoSaveRef.current = true;
        setDraft(hydrated);
        setPendingRecoveryDraft(null);
        setConflict(null);
        setSyncStatus('synced');
        return persisted;
      } catch (error) {
        if (error instanceof ApiError && error.status === 409) {
          const remoteDraft = extractRemoteDraft(error);
          if (remoteDraft) {
            setConflict({
              remoteDraft,
              localDraft: candidateDraft,
            });
          }
          setSyncStatus('conflict');
          return null;
        }

        const message =
          error instanceof Error
            ? error.message
            : 'No se pudo sincronizar el borrador de recepción.';
        setSyncError(message);
        setSyncStatus('error');
        return null;
      } finally {
        isSyncingRef.current = false;
      }
    },
    [defaultDraft]
  );

  const persistCurrentDraftSilently = useCallback(async () => {
    if (activeStepRef.current >= 3 || pendingRecoveryDraft) {
      return;
    }

    if (!hasRecepcionDraftContent(draftRef.current)) {
      return;
    }

    try {
      const persisted = await saveRecepcionDraft(draftRef.current);
      // Sincronizamos la versión para que el siguiente auto-save no de conflicto 409
      draftRef.current.serverVersion = persisted.version;
      draftRef.current.serverUpdatedAt = persisted.updatedAt;
    } catch {
      // El guardado silencioso en salida no debe interrumpir navegación.
    }
  }, [pendingRecoveryDraft]);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      try {
        const remoteDraft = await fetchRecepcionDraft();
        if (!isMounted) {
          return;
        }

        if (remoteDraft?.payload) {
          const hydrated = hydrateRecepcionDraft(
            remoteDraft.payload,
            remoteDraft,
            defaultDraft()
          );

          if (hasRecepcionDraftContent(hydrated)) {
            if (autoResume) {
              applyDraftEnvelope(remoteDraft);
            } else {
              setPendingRecoveryDraft(remoteDraft);
              setSyncStatus('synced');
            }
          }
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setSyncStatus('error');
        setSyncError(
          error instanceof Error
            ? error.message
            : 'No se pudo recuperar el borrador de recepción.'
        );
      } finally {
        if (isMounted) {
          setIsReady(true);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [applyDraftEnvelope, autoResume, defaultDraft]);

  useEffect(() => {
    if (!isReady || activeStep >= 3 || pendingRecoveryDraft) {
      return;
    }

    if (skipAutoSaveRef.current) {
      skipAutoSaveRef.current = false;
      return;
    }

    if (pendingSyncTimerRef.current != null) {
      return;
    }

    pendingSyncTimerRef.current = window.setTimeout(() => {
      pendingSyncTimerRef.current = null;
      void syncDraft();
    }, debounceMs);

    return () => {
      if (pendingSyncTimerRef.current != null) {
        window.clearTimeout(pendingSyncTimerRef.current);
        pendingSyncTimerRef.current = null;
      }
    };
  }, [activeStep, debounceMs, draft, isReady, pendingRecoveryDraft, syncDraft]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        typeof document !== 'undefined' &&
        document.visibilityState === 'hidden'
      ) {
        void persistCurrentDraftSilently();
      }
    };

    const handlePageHide = () => {
      void persistCurrentDraftSilently();
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('pagehide', handlePageHide);
    }

    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener(
          'visibilitychange',
          handleVisibilityChange
        );
      }

      if (typeof window !== 'undefined') {
        window.removeEventListener('pagehide', handlePageHide);
      }

      if (pendingSyncTimerRef.current != null) {
        window.clearTimeout(pendingSyncTimerRef.current);
        pendingSyncTimerRef.current = null;
      }

      void persistCurrentDraftSilently();
    };
  }, [persistCurrentDraftSilently]);

  const clearDraft = useCallback(async () => {
    await deleteRecepcionDraft();
    skipAutoSaveRef.current = true;
    setConflict(null);
    setPendingRecoveryDraft(null);
    setSyncError(null);
    setSyncStatus('idle');
    setDraft(defaultDraft());
  }, [defaultDraft]);

  const applyPendingRecoveryDraft = useCallback(() => {
    if (!pendingRecoveryDraft) {
      return;
    }

    applyDraftEnvelope(pendingRecoveryDraft);
  }, [applyDraftEnvelope, pendingRecoveryDraft]);

  const useRemoteDraft = useCallback(() => {
    if (!conflict) {
      return;
    }

    applyDraftEnvelope(conflict.remoteDraft);
  }, [applyDraftEnvelope, conflict]);

  const keepLocalDraft = useCallback(async () => {
    if (!conflict) {
      return;
    }

    await syncDraft({
      ...conflict.localDraft,
      serverVersion: conflict.remoteDraft.version,
      serverUpdatedAt: conflict.remoteDraft.updatedAt,
    });
  }, [conflict, syncDraft]);

  return useMemo(
    () => ({
      applyPendingRecoveryDraft,
      clearDraft,
      conflict,
      draft,
      isReady,
      keepLocalDraft,
      pendingRecoveryDraft,
      setDraft,
      syncDraft,
      syncError,
      syncStatus,
      useRemoteDraft,
    }),
    [
      applyPendingRecoveryDraft,
      clearDraft,
      conflict,
      draft,
      isReady,
      keepLocalDraft,
      pendingRecoveryDraft,
      setDraft,
      syncDraft,
      syncError,
      syncStatus,
      useRemoteDraft,
    ]
  );
}

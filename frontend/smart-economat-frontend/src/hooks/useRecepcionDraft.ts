import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ApiError } from '../services/api.service';
import {
  deleteRecepcionDraft,
  fetchRecepcionDraft,
  saveRecepcionDraft,
} from '../services/recepcionDraft.service';
import {
  PasoWizard,
  RecepcionDraft,
  RecepcionDraftEnvelope,
} from '../services/recepcion.types';

const STEP_ORDER: PasoWizard[] = [
  'SELECCION_PEDIDOS',
  'ESCANEO_LOTE',
  'REVISION_FINAL',
  'RESULTADO',
];

type SyncStatus = 'idle' | 'saving' | 'synced' | 'error' | 'conflict';

interface UseRecepcionDraftOptions {
  activeStep: number;
  debounceMs?: number;
  defaultDraft: () => RecepcionDraft;
  setActiveStep: (step: number) => void;
}

interface ConflictPayload {
  remoteDraft: RecepcionDraftEnvelope;
  localDraft: RecepcionDraft;
}

function hydrateDraft(
  draft: RecepcionDraft,
  envelope: RecepcionDraftEnvelope | null
): RecepcionDraft {
  return {
    ...draft,
    serverVersion: envelope?.version ?? null,
    serverUpdatedAt: envelope?.updatedAt ?? null,
    modificadoEn: envelope?.updatedAt ?? draft.modificadoEn,
    creadoEn: envelope?.createdAt ?? draft.creadoEn,
  };
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

export function useRecepcionDraft({
  activeStep,
  debounceMs = 2000,
  defaultDraft,
  setActiveStep,
}: UseRecepcionDraftOptions) {
  const [draft, setDraft] = useState<RecepcionDraft>(() => defaultDraft());
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
      isSyncingRef.current = true;
      setSyncStatus('saving');
      setSyncError(null);

      try {
        const persisted = await saveRecepcionDraft(candidateDraft);
        const hydrated = hydrateDraft(persisted.payload, persisted);
        skipAutoSaveRef.current = true;
        setDraft(hydrated);
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
    []
  );

  const persistCurrentDraftSilently = useCallback(async () => {
    if (activeStepRef.current >= 3) {
      return;
    }

    try {
      await saveRecepcionDraft(draftRef.current);
    } catch {
      // El guardado silencioso en salida no debe interrumpir navegación.
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      try {
        const remoteDraft = await fetchRecepcionDraft();
        if (!isMounted) {
          return;
        }

        if (remoteDraft?.payload) {
          skipAutoSaveRef.current = true;
          const hydrated = hydrateDraft(remoteDraft.payload, remoteDraft);
          setDraft(hydrated);
          const stepIndex = STEP_ORDER.indexOf(hydrated.paso);
          if (stepIndex >= 0) {
            setActiveStep(stepIndex);
          }
          setSyncStatus('synced');
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
  }, [defaultDraft, setActiveStep]);

  useEffect(() => {
    if (!isReady || activeStep >= 3) {
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
  }, [activeStep, debounceMs, draft, isReady, syncDraft]);

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
    try {
      await deleteRecepcionDraft();
    } catch (error) {
      setSyncError(
        error instanceof Error
          ? error.message
          : 'No se pudo eliminar el borrador remoto de recepción.'
      );
    }
    skipAutoSaveRef.current = true;
    setConflict(null);
    setSyncStatus('idle');
    setDraft(defaultDraft());
  }, [defaultDraft]);

  const useRemoteDraft = useCallback(() => {
    if (!conflict) {
      return;
    }

    skipAutoSaveRef.current = true;
    const hydrated = hydrateDraft(
      conflict.remoteDraft.payload,
      conflict.remoteDraft
    );
    setDraft(hydrated);
    const stepIndex = STEP_ORDER.indexOf(hydrated.paso);
    if (stepIndex >= 0) {
      setActiveStep(stepIndex);
    }
    setConflict(null);
    setSyncStatus('synced');
  }, [conflict, setActiveStep]);

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
      clearDraft,
      conflict,
      draft,
      isReady,
      keepLocalDraft,
      setDraft,
      syncDraft,
      syncError,
      syncStatus,
      useRemoteDraft,
    }),
    [
      clearDraft,
      conflict,
      draft,
      isReady,
      keepLocalDraft,
      setDraft,
      syncDraft,
      syncError,
      syncStatus,
      useRemoteDraft,
    ]
  );
}

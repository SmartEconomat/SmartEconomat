import {
  PasoWizard,
  RecepcionDraft,
  RecepcionDraftEnvelope,
} from '../services/recepcion.types';

/** Constantes públicas (RECEPCION_STEP_ORDER) expuestas en smart-economat-frontend (SPA). */
export const RECEPCION_STEP_ORDER: PasoWizard[] = [
  'SELECCION_PEDIDOS',
  'ESCANEO_LOTE',
  'REVISION_FINAL',
  'RESULTADO',
];

function isPasoWizard(value: unknown): value is PasoWizard {
  return (
    typeof value === 'string' &&
    RECEPCION_STEP_ORDER.includes(value as PasoWizard)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Expone "hasRecepcionDraftContent" en smart-economat-frontend (SPA).
 * @undefined {RecepcionDraft} draft - Entrada efectiva esperada por el contrato.
 * @undefined {boolean} Datos efectivos después de ejecutar la operación.
 */
export function hasRecepcionDraftContent(draft: RecepcionDraft): boolean {
  const hasSelectedPedidos = draft.pedidosSeleccionados.length > 0;
  const hasSpontaneousProducts = draft.productosEspontaneos.length > 0;
  const hasHeaderData =
    draft.nAlbaran.trim().length > 0 || draft.observaciones.trim().length > 0;
  const hasProgressedStep = draft.paso !== 'SELECCION_PEDIDOS';

  return (
    hasSelectedPedidos ||
    hasSpontaneousProducts ||
    hasHeaderData ||
    hasProgressedStep
  );
}

/**
 * Expone "normalizeRecepcionDraftStep" en smart-economat-frontend (SPA).
 * @undefined {Pick<RecepcionDraft, "paso" | "pedidosSeleccionados" | "productosEspontaneos">} draft - Entrada efectiva esperada por el contrato.
 * @undefined {PasoWizard} Datos efectivos después de ejecutar la operación.
 */
export function normalizeRecepcionDraftStep(
  draft: Pick<
    RecepcionDraft,
    'paso' | 'pedidosSeleccionados' | 'productosEspontaneos'
  >
): PasoWizard {
  const requestedStep = isPasoWizard(draft.paso)
    ? draft.paso
    : 'SELECCION_PEDIDOS';
  const hasWorkItems =
    draft.pedidosSeleccionados.length > 0 ||
    draft.productosEspontaneos.length > 0;

  if (!hasWorkItems && requestedStep !== 'SELECCION_PEDIDOS') {
    return 'SELECCION_PEDIDOS';
  }

  if (requestedStep === 'RESULTADO') {
    return hasWorkItems ? 'REVISION_FINAL' : 'SELECCION_PEDIDOS';
  }

  return requestedStep;
}

/**
 * Expone "hydrateRecepcionDraft" en smart-economat-frontend (SPA).
 * @undefined {RecepcionDraft | Record<string, unknown> | null | undefined} payload - Entrada efectiva esperada por el contrato.
 * @undefined {Pick<RecepcionDraftEnvelope, "version" | "updatedAt" | "createdAt"> | null} envelope - Entrada efectiva esperada por el contrato.
 * @undefined {RecepcionDraft} fallbackDraft - Entrada efectiva esperada por el contrato.
 * @undefined {RecepcionDraft} Datos efectivos después de ejecutar la operación.
 */
export function hydrateRecepcionDraft(
  payload: RecepcionDraft | Record<string, unknown> | null | undefined,
  envelope: Pick<
    RecepcionDraftEnvelope,
    'version' | 'updatedAt' | 'createdAt'
  > | null,
  fallbackDraft: RecepcionDraft
): RecepcionDraft {
  const draftPayload = isRecord(payload) ? payload : {};
  const observaciones = draftPayload.observaciones;
  const nAlbaran = draftPayload.nAlbaran;
  const creadoEn = draftPayload.creadoEn;
  const modificadoEn = draftPayload.modificadoEn;
  const enviando = draftPayload.enviando;
  const erroresPorLinea = draftPayload.erroresPorLinea;
  const pedidosSeleccionados = draftPayload.pedidosSeleccionados;
  const productosEspontaneos = draftPayload.productosEspontaneos;
  const paso = draftPayload.paso;

  const hydratedDraft: RecepcionDraft = {
    ...fallbackDraft,
    ...draftPayload,
    observaciones:
      typeof observaciones === 'string'
        ? observaciones
        : fallbackDraft.observaciones,
    nAlbaran: typeof nAlbaran === 'string' ? nAlbaran : fallbackDraft.nAlbaran,
    creadoEn:
      envelope?.createdAt ??
      (typeof creadoEn === 'string' ? creadoEn : fallbackDraft.creadoEn),
    modificadoEn:
      envelope?.updatedAt ??
      (typeof modificadoEn === 'string'
        ? modificadoEn
        : fallbackDraft.modificadoEn),
    serverVersion: envelope?.version ?? null,
    serverUpdatedAt: envelope?.updatedAt ?? null,
    pedidosSeleccionados: Array.isArray(pedidosSeleccionados)
      ? (pedidosSeleccionados as RecepcionDraft['pedidosSeleccionados'])
      : fallbackDraft.pedidosSeleccionados,
    productosEspontaneos: Array.isArray(productosEspontaneos)
      ? (productosEspontaneos as RecepcionDraft['productosEspontaneos'])
      : fallbackDraft.productosEspontaneos,
    erroresPorLinea: isRecord(erroresPorLinea)
      ? (erroresPorLinea as RecepcionDraft['erroresPorLinea'])
      : fallbackDraft.erroresPorLinea,
    enviando: typeof enviando === 'boolean' ? enviando : fallbackDraft.enviando,
    paso: isPasoWizard(paso) ? paso : fallbackDraft.paso,
  };

  hydratedDraft.paso = normalizeRecepcionDraftStep(hydratedDraft);

  return hydratedDraft;
}

/**
 * Obtiene valores o vistas materializadas.
 * @undefined {RecepcionDraft} draft - Entrada efectiva esperada por el contrato.
 * @undefined {number} Datos efectivos después de ejecutar la operación.
 */
export function getRecepcionDraftStepIndex(draft: RecepcionDraft): number {
  return Math.max(0, RECEPCION_STEP_ORDER.indexOf(draft.paso));
}

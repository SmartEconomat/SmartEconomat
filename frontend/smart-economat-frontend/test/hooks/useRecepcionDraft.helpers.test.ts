import { describe, expect, it } from 'vitest';
import type { RecepcionDraft } from '../../src/services/recepcion.types';
import {
  getRecepcionDraftStepIndex,
  hasRecepcionDraftContent,
  hydrateRecepcionDraft,
  normalizeRecepcionDraftStep,
} from '../../src/hooks/useRecepcionDraft.helpers';

const buildDraft = (): RecepcionDraft => ({
  version: 2,
  creadoEn: '2025-01-01T10:00:00.000Z',
  modificadoEn: '2025-01-01T10:00:00.000Z',
  serverVersion: null,
  serverUpdatedAt: null,
  observaciones: '',
  nAlbaran: '',
  pedidosSeleccionados: [],
  productosEspontaneos: [],
  paso: 'SELECCION_PEDIDOS',
  erroresPorLinea: {},
  enviando: false,
});

describe('useRecepcionDraft.helpers', () => {
  it('normaliza RESULTADO a REVISION_FINAL cuando el borrador sí tiene trabajo pendiente', () => {
    const hydrated = hydrateRecepcionDraft(
      {
        pedidosSeleccionados: [
          {
            id: 'pedido-1',
            descripcion: 'Pedido de prueba',
            proveedor: 'Proveedor de prueba',
            lineas: [],
          },
        ],
        paso: 'RESULTADO',
      },
      {
        version: 5,
        createdAt: '2025-01-01T09:00:00.000Z',
        updatedAt: '2025-01-01T11:00:00.000Z',
      },
      buildDraft()
    );

    expect(hydrated.paso).toBe('REVISION_FINAL');
    expect(getRecepcionDraftStepIndex(hydrated)).toBe(2);
    expect(hydrated.serverVersion).toBe(5);
    expect(hydrated.serverUpdatedAt).toBe('2025-01-01T11:00:00.000Z');
  });

  it('retrocede a SELECCION_PEDIDOS cuando el paso remoto no encaja con un borrador vacío', () => {
    const hydrated = hydrateRecepcionDraft(
      {
        paso: 'ESCANEO_LOTE',
      },
      null,
      buildDraft()
    );

    expect(hydrated.paso).toBe('SELECCION_PEDIDOS');
    expect(hasRecepcionDraftContent(hydrated)).toBe(false);
  });

  it('detecta contenido recuperable cuando existe progreso real o cabecera informada', () => {
    expect(
      hasRecepcionDraftContent({
        ...buildDraft(),
        observaciones: 'Recepción parcial',
      })
    ).toBe(true);

    expect(
      normalizeRecepcionDraftStep({
        paso: 'REVISION_FINAL',
        pedidosSeleccionados: [],
        productosEspontaneos: [],
      })
    ).toBe('SELECCION_PEDIDOS');
  });
});

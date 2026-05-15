import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as apiService from '../../src/services/api.service';
import { fetchIncidencias } from '../../src/services/incidencia.service';
import { EstadoIncidencia } from '../../src/services/incidencia.types';

vi.mock('../../src/services/api.service', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../src/services/api.service')>();
  return {
    ...actual,
    baseFetch: vi.fn(),
  };
});

function makeRawIncidencia(overrides: Record<string, unknown> = {}) {
  return {
    id: 'inc-001',
    recepcionId: 'rec-001',
    pedidoId: 'ped-001',
    estado: 'NUEVA',
    resuelta: false,
    lineas: [],
    ...overrides,
  };
}

function mockBaseFetch(rawData: unknown) {
  vi.mocked(apiService.baseFetch).mockResolvedValue({
    ok: true,
    json: vi.fn().mockResolvedValue({
      data: {
        data: [rawData],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
    }),
  } as unknown as Response);
}

describe('normalizeEstadoIncidencia — bug 1: casing incorrecto', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe mapear NUEVA (mayúsculas, formato backend) correctamente', async () => {
    mockBaseFetch(makeRawIncidencia({ estado: 'NUEVA' }));
    const result = await fetchIncidencias();
    expect(result.data[0]?.estado).toBe(EstadoIncidencia.NUEVA);
  });

  it('debe mapear EN_AJUSTE (mayúsculas) correctamente', async () => {
    mockBaseFetch(makeRawIncidencia({ estado: 'EN_AJUSTE' }));
    const result = await fetchIncidencias();
    expect(result.data[0]?.estado).toBe(EstadoIncidencia.EN_AJUSTE);
  });

  it('debe mapear RESUELTA correctamente', async () => {
    mockBaseFetch(makeRawIncidencia({ estado: 'RESUELTA' }));
    const result = await fetchIncidencias();
    expect(result.data[0]?.estado).toBe(EstadoIncidencia.RESUELTA);
  });

  it('debe mapear CANCELADA correctamente', async () => {
    mockBaseFetch(makeRawIncidencia({ estado: 'CANCELADA' }));
    const result = await fetchIncidencias();
    expect(result.data[0]?.estado).toBe(EstadoIncidencia.CANCELADA);
  });

  it('debe mapear PENDIENTE_VALIDACION correctamente', async () => {
    mockBaseFetch(makeRawIncidencia({ estado: 'PENDIENTE_VALIDACION' }));
    const result = await fetchIncidencias();
    expect(result.data[0]?.estado).toBe(EstadoIncidencia.PENDIENTE_VALIDACION);
  });

  it('debe mapear ABIERTA correctamente', async () => {
    mockBaseFetch(makeRawIncidencia({ estado: 'ABIERTA' }));
    const result = await fetchIncidencias();
    expect(result.data[0]?.estado).toBe(EstadoIncidencia.ABIERTA);
  });

  it('debe mapear EN_PROCESO correctamente', async () => {
    mockBaseFetch(makeRawIncidencia({ estado: 'EN_PROCESO' }));
    const result = await fetchIncidencias();
    expect(result.data[0]?.estado).toBe(EstadoIncidencia.EN_PROCESO);
  });

  it('REGRESIÓN: NUEVA del backend no debe caer al fallback heurístico (era el bug principal)', async () => {
    mockBaseFetch(
      makeRawIncidencia({
        estado: 'NUEVA',
        resuelta: false,
        lineas: [],
      })
    );
    const result = await fetchIncidencias();
    // Con el bug: 'NUEVA'.toLowerCase() = 'nueva', case 'NUEVA' no coincidía → null → fallback
    // Ahora debe coincidir directamente sin llegar al fallback
    expect(result.data[0]?.estado).toBe(EstadoIncidencia.NUEVA);
  });

  it('REGRESIÓN: EN_AJUSTE del backend no debe caer al fallback heurístico', async () => {
    mockBaseFetch(
      makeRawIncidencia({
        estado: 'EN_AJUSTE',
        resuelta: false,
        lineas: [],
      })
    );
    const result = await fetchIncidencias();
    expect(result.data[0]?.estado).toBe(EstadoIncidencia.EN_AJUSTE);
  });

  it('debe mapear alias en minúsculas "cancelado" → CANCELADA (compatibilidad legacy)', async () => {
    mockBaseFetch(makeRawIncidencia({ estado: 'cancelado' }));
    const result = await fetchIncidencias();
    expect(result.data[0]?.estado).toBe(EstadoIncidencia.CANCELADA);
  });

  it('debe mapear alias en minúsculas "invalido" → INVALIDA (compatibilidad legacy)', async () => {
    mockBaseFetch(makeRawIncidencia({ estado: 'invalido' }));
    const result = await fetchIncidencias();
    expect(result.data[0]?.estado).toBe(EstadoIncidencia.INVALIDA);
  });

  it('debe mapear alias "pendiente" → NUEVA', async () => {
    mockBaseFetch(makeRawIncidencia({ estado: 'pendiente' }));
    const result = await fetchIncidencias();
    expect(result.data[0]?.estado).toBe(EstadoIncidencia.NUEVA);
  });

  it('debe mapear alias "en_revision" → EN_AJUSTE', async () => {
    mockBaseFetch(makeRawIncidencia({ estado: 'en_revision' }));
    const result = await fetchIncidencias();
    expect(result.data[0]?.estado).toBe(EstadoIncidencia.EN_AJUSTE);
  });

  it('debe mapear alias "parcial" → EN_AJUSTE', async () => {
    mockBaseFetch(makeRawIncidencia({ estado: 'parcial' }));
    const result = await fetchIncidencias();
    expect(result.data[0]?.estado).toBe(EstadoIncidencia.EN_AJUSTE);
  });

  it('estado desconocido debe activar el fallback heurístico (no devolver null en blanco)', async () => {
    mockBaseFetch(
      makeRawIncidencia({
        estado: 'ESTADO_INEXISTENTE',
        resuelta: false,
        lineas: [],
      })
    );
    const result = await fetchIncidencias();
    // El fallback de resolveEstadoIncidenciaFallback debe retornar algún EstadoIncidencia
    expect(Object.values(EstadoIncidencia)).toContain(result.data[0]?.estado);
  });
});

describe('mapIncidencia — bug 2: proveedorId debe ser UUID, no nombre', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('proveedorId debe ser el UUID del proveedor, no el nombre', async () => {
    mockBaseFetch(
      makeRawIncidencia({
        pedido: {
          id: 'ped-001',
          proveedor: { id: 'prov-uuid-123', nombre: 'Proveedor ABC' },
        },
      })
    );
    const result = await fetchIncidencias();
    const incidencia = result.data[0];

    expect(incidencia?.proveedorId).toBe('prov-uuid-123');
    expect(incidencia?.proveedorId).not.toBe('Proveedor ABC');
  });

  it('proveedorId usa pedidoId como fallback cuando proveedor no tiene id', async () => {
    mockBaseFetch(
      makeRawIncidencia({
        pedidoId: 'ped-fallback-uuid',
        pedido: {
          id: 'ped-001',
          proveedor: { nombre: 'Proveedor Sin UUID' },
        },
      })
    );
    const result = await fetchIncidencias();
    expect(result.data[0]?.proveedorId).toBe('ped-fallback-uuid');
  });

  it('proveedorId es string vacío cuando no hay proveedor ni pedidoId', async () => {
    mockBaseFetch(
      makeRawIncidencia({
        pedidoId: null,
        pedido: null,
      })
    );
    const result = await fetchIncidencias();
    expect(result.data[0]?.proveedorId).toBe('');
  });

  it('proveedorNombre sigue usando el nombre del proveedor (campo independiente)', async () => {
    mockBaseFetch(
      makeRawIncidencia({
        pedido: {
          id: 'ped-001',
          proveedor: { id: 'prov-uuid-123', nombre: 'Proveedor ABC' },
        },
      })
    );
    const result = await fetchIncidencias();
    expect(result.data[0]?.proveedorNombre).toBe('Proveedor ABC');
  });
});

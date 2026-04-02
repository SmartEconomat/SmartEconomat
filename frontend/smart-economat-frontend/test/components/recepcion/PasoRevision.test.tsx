import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import PasoRevision from '../../../src/components/recepcion/PasoRevision';
import {
  RecepcionDraft,
  EstadoVisualProducto,
} from '../../../src/services/recepcion.types';
import { UnidadMedida } from '../../../src/services/producto.types';

describe('PasoRevision', () => {
  const getMockDraft = (isWeighedWithScale: boolean): RecepcionDraft => ({
    version: 1,
    paso: 'REVISION_FINAL',
    creadoEn: new Date().toISOString(),
    modificadoEn: new Date().toISOString(),
    observaciones: '',
    nAlbaran: '',
    pedidosSeleccionados: [
      {
        id: 'ped-1',
        proveedor: 'Prov A',
        descripcion: 'Pedido A',
        lineas: [
          {
            pedidoProductoId: 'pp-1',
            nombreProducto: 'Producto Test',
            cantidadPedida: 10,
            cantidadYaRecibida: 0,
            cantidadRecibida: 5,
            cantidadAlbaran: 5,
            observaciones: '',
            isWeighedWithScale,
            estadoVisual: EstadoVisualProducto.OPTIMO,
            estado: 'Parcial',
            unidad: UnidadMedida.KG,
          },
        ],
      },
    ],
    productosEspontaneos: [],
    erroresPorLinea: {},
    enviando: false,
  });

  const defaultProps = {
    setDraft: vi.fn(),
    expandedPanel: 'ped-1',
    setExpandedPanel: vi.fn(),
    onUpdateLinea: vi.fn(),
  };

  it('debería mostrar "Báscula" cuando la línea fue pesada con báscula (isWeighedWithScale: true)', () => {
    const draft = getMockDraft(true);
    render(<PasoRevision {...defaultProps} draft={draft} />);

    // Buscar en el componente el Chip que indica Báscula
    expect(screen.getByText('Báscula')).toBeDefined();
    expect(screen.queryByText('Manual')).toBeNull();
  });

  it('debería mostrar "Manual" cuando la línea no fue pesada con báscula (isWeighedWithScale: false)', () => {
    const draft = getMockDraft(false);
    render(<PasoRevision {...defaultProps} draft={draft} />);

    // Buscar en el componente el Chip que indica Manual
    expect(screen.getByText('Manual')).toBeDefined();
    expect(screen.queryByText('Báscula')).toBeNull();
  });
});

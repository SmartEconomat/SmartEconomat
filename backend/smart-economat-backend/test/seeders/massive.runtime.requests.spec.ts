import { extractActiveEntityIds } from '../../src/seeders/massive.helpers.common';
import { selectMermaCandidateFromStockResponse } from '../../src/seeders/massive.runtime.requests';

describe('massive.runtime.requests active provider selection', () => {
  it('excludes soft-deleted proveedores when building active ids', () => {
    expect(
      extractActiveEntityIds([
        { id: 'proveedor-activo-1', deletedAt: null, deletedBy: null },
        { id: 'proveedor-borrado-1', deletedAt: '2026-04-01T17:30:27.996Z' },
        { id: 'proveedor-activo-2' },
        { id: 'proveedor-borrado-2', deletedBy: 'usuario-1' },
      ])
    ).toEqual(['proveedor-activo-1', 'proveedor-activo-2']);
  });
});

describe('massive.runtime.requests merma stock selection', () => {
  it('picks the strongest viable stock and caps the amount for merma', () => {
    const result = selectMermaCandidateFromStockResponse(
      [
        { productoId: 'producto-sin-stock', stockTotal: 0 },
        { productoId: 'producto-fuerte', stockTotal: 10 },
        { productoId: 'producto-medio', stockTotal: 4 },
      ],
      0
    );

    expect(result).toEqual({
      productoId: 'producto-fuerte',
      maxCantidad: 1.5,
    });
  });

  it('rotates across viable products after sorting by stock', () => {
    const result = selectMermaCandidateFromStockResponse(
      [
        { productoId: 'producto-medio', stockTotal: 4 },
        { productoId: 'producto-fuerte', stockTotal: 10 },
      ],
      1
    );

    expect(result).toEqual({
      productoId: 'producto-medio',
      maxCantidad: 1,
    });
  });
});

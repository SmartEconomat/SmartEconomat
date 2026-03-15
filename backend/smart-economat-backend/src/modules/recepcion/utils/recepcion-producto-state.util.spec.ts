import { EstadoProductoRecepcion } from '../enums/estado-producto.enum';
import { EstadoVisualProducto } from '../enums/estado-visual.enum';
import {
  esEstadoConIncidencia,
  permiteComputarComoRecibido,
  permiteIncrementarInventario,
  resolveEstadoProducto,
} from './recepcion-producto-state.util';

describe('recepcion-producto-state.util', () => {
  it('prioriza `estadoProducto` cuando viene informado', () => {
    expect(
      resolveEstadoProducto({
        estadoProducto: EstadoProductoRecepcion.EXCEDE,
        estadoVisual: EstadoVisualProducto.ROTO,
      })
    ).toBe(EstadoProductoRecepcion.EXCEDE);
  });

  it('mapea estados visuales legacy de rotura a `ROTO`', () => {
    expect(
      resolveEstadoProducto({
        estadoVisual: EstadoVisualProducto.ROTO,
      })
    ).toBe(EstadoProductoRecepcion.ROTO);

    expect(
      resolveEstadoProducto({
        estadoVisual: EstadoVisualProducto.DEFECTUOSO,
      })
    ).toBe(EstadoProductoRecepcion.ROTO);
  });

  it('solo incrementa inventario para estados recepcionables', () => {
    expect(permiteIncrementarInventario(EstadoProductoRecepcion.PERFECTO)).toBe(
      true
    );
    expect(permiteIncrementarInventario(EstadoProductoRecepcion.EXCEDE)).toBe(
      true
    );
    expect(permiteIncrementarInventario(EstadoProductoRecepcion.ROTO)).toBe(
      false
    );
    expect(
      permiteIncrementarInventario(EstadoProductoRecepcion.FALTA_TOTAL)
    ).toBe(false);
  });

  it('marca incidencia y cómputo recibido de forma coherente', () => {
    expect(permiteComputarComoRecibido(EstadoProductoRecepcion.PERFECTO)).toBe(
      true
    );
    expect(permiteComputarComoRecibido(EstadoProductoRecepcion.EXCEDE)).toBe(
      true
    );
    expect(permiteComputarComoRecibido(EstadoProductoRecepcion.ROTO)).toBe(
      false
    );
    expect(esEstadoConIncidencia(EstadoProductoRecepcion.FALTA_TOTAL)).toBe(
      true
    );
    expect(esEstadoConIncidencia(EstadoProductoRecepcion.PERFECTO)).toBe(false);
  });
});

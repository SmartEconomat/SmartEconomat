import { Inventario } from '../../../src/modules/inventario/inventario.entity/inventario.entity';

describe('Inventario entity', () => {
  it('ajustarCantidad rechaza resultados negativos', () => {
    const inventario = new Inventario();
    inventario.cantidadActual = 2;

    expect(() => inventario.ajustarCantidad(-3)).toThrow(/Stock insuficiente/i);
  });

  it('esBajoStock devuelve true solo cuando la cantidad actual es menor a la mínima', () => {
    const inventario = new Inventario();
    inventario.cantidadActual = 4;
    inventario.cantidadMinima = 5;
    expect(inventario.esBajoStock()).toBe(true);

    inventario.cantidadActual = 5;
    expect(inventario.esBajoStock()).toBe(false);
  });

  it('proximoACaducar usa el umbral indicado', () => {
    const inventario = new Inventario();
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + 6);
    inventario.fechaCaducidad = fecha;

    expect(inventario.proximoACaducar(7)).toBe(true);
    expect(inventario.proximoACaducar(3)).toBe(false);
  });
});

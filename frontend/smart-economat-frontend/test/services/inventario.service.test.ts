import { describe, expect, it } from 'vitest';
import { agregarInventarioPorProducto } from '../../src/services/inventario.service';
import type { InventarioItem } from '../../src/services/inventario.types';

interface BuildInventarioItemInput {
  id: string;
  productoId: string;
  nombreProducto: string;
  cantidadActual: number;
  cantidadMinima: number;
  proveedorNombre: string;
  ubicacionNombre: string;
  deletedAt?: string | null;
}

const buildInventarioItem = ({
  id,
  productoId,
  nombreProducto,
  cantidadActual,
  cantidadMinima,
  proveedorNombre,
  ubicacionNombre,
  deletedAt,
}: BuildInventarioItemInput): InventarioItem => ({
  id,
  deletedAt,
  cantidadActual,
  cantidadMinima,
  ubicacion: {
    id: `ub-${ubicacionNombre.replace(/\s+/g, '-').toLowerCase()}`,
    nombre: ubicacionNombre,
  },
  productoProveedor: {
    id: `pp-${id}`,
    producto: {
      id: productoId,
      nombre: nombreProducto,
      unidad: 'kg',
      tipo: 'VERDURA',
    },
    proveedor: {
      id: `prov-${proveedorNombre.replace(/\s+/g, '-').toLowerCase()}`,
      nombre: proveedorNombre,
    },
  },
});

describe('inventario.service agregarInventarioPorProducto', () => {
  it('marca bajo stock cuando al menos un lote del producto esta por debajo del minimo', () => {
    const items: InventarioItem[] = [
      buildInventarioItem({
        id: 'inv-1',
        productoId: 'prod-1',
        nombreProducto: 'Tomate',
        cantidadActual: 5,
        cantidadMinima: 20,
        proveedorNombre: 'Proveedor A',
        ubicacionNombre: 'Camara 1',
      }),
      buildInventarioItem({
        id: 'inv-2',
        productoId: 'prod-1',
        nombreProducto: 'Tomate',
        cantidadActual: 100,
        cantidadMinima: 20,
        proveedorNombre: 'Proveedor B',
        ubicacionNombre: 'Camara 2',
      }),
    ];

    const result = agregarInventarioPorProducto(items);

    expect(result).toHaveLength(1);
    expect(result[0].cantidadTotal).toBe(105);
    expect(result[0].bajoStock).toBe(true);
  });

  it('no incluye productos cuyos lotes tienen cantidad cero', () => {
    const items: InventarioItem[] = [
      buildInventarioItem({
        id: 'inv-3',
        productoId: 'prod-2',
        nombreProducto: 'Lechuga',
        cantidadActual: 0,
        cantidadMinima: 3,
        proveedorNombre: 'Proveedor C',
        ubicacionNombre: 'Camara 3',
      }),
    ];

    const result = agregarInventarioPorProducto(items);

    expect(result).toHaveLength(0);
  });

  it('agrega proveedores y ubicaciones sin duplicados', () => {
    const items: InventarioItem[] = [
      buildInventarioItem({
        id: 'inv-4',
        productoId: 'prod-3',
        nombreProducto: 'Cebolla',
        cantidadActual: 12,
        cantidadMinima: 6,
        proveedorNombre: 'Proveedor D',
        ubicacionNombre: 'Estanteria 1',
      }),
      buildInventarioItem({
        id: 'inv-5',
        productoId: 'prod-3',
        nombreProducto: 'Cebolla',
        cantidadActual: 4,
        cantidadMinima: 6,
        proveedorNombre: 'Proveedor D',
        ubicacionNombre: 'Estanteria 1',
      }),
      buildInventarioItem({
        id: 'inv-6',
        productoId: 'prod-3',
        nombreProducto: 'Cebolla',
        cantidadActual: 8,
        cantidadMinima: 6,
        proveedorNombre: 'Proveedor E',
        ubicacionNombre: 'Estanteria 2',
      }),
    ];

    const result = agregarInventarioPorProducto(items);

    expect(result).toHaveLength(1);
    expect(result[0].proveedores).toEqual(['Proveedor D', 'Proveedor E']);
    expect(result[0].ubicaciones).toEqual(['Estanteria 1', 'Estanteria 2']);
  });

  it('ignora lotes soft-deleted al consolidar stock por producto', () => {
    const items: InventarioItem[] = [
      buildInventarioItem({
        id: 'inv-active',
        productoId: 'prod-4',
        nombreProducto: 'Garbanzos',
        cantidadActual: 10,
        cantidadMinima: 4,
        proveedorNombre: 'Proveedor F',
        ubicacionNombre: 'Almacén Principal',
      }),
      buildInventarioItem({
        id: 'inv-deleted',
        productoId: 'prod-4',
        nombreProducto: 'Garbanzos',
        cantidadActual: 999,
        cantidadMinima: 4,
        proveedorNombre: 'Proveedor F',
        ubicacionNombre: 'Almacén Principal',
        deletedAt: '2026-04-04T19:00:00.000Z',
      }),
    ];

    const result = agregarInventarioPorProducto(items);

    expect(result).toHaveLength(1);
    expect(result[0].cantidadTotal).toBe(10);
  });

  it('ordena productos alfabéticamente por nombre', () => {
    const items: InventarioItem[] = [
      buildInventarioItem({
        id: 'inv-z',
        productoId: 'prod-z',
        nombreProducto: 'Zanahoria',
        cantidadActual: 1,
        cantidadMinima: 1,
        proveedorNombre: 'P',
        ubicacionNombre: 'U',
      }),
      buildInventarioItem({
        id: 'inv-a',
        productoId: 'prod-a',
        nombreProducto: 'Aceite',
        cantidadActual: 2,
        cantidadMinima: 1,
        proveedorNombre: 'P',
        ubicacionNombre: 'U',
      }),
    ];

    const result = agregarInventarioPorProducto(items);

    expect(result.map((r) => r.nombre)).toEqual(['Aceite', 'Zanahoria']);
  });

  it('consolida contenidoPorUnidad cuando el primer lote no lo trae y uno posterior sí', () => {
    const items: InventarioItem[] = [
      buildInventarioItem({
        id: 'inv-1',
        productoId: 'prod-k',
        nombreProducto: 'Kiwi',
        cantidadActual: 1,
        cantidadMinima: 0,
        proveedorNombre: 'P',
        ubicacionNombre: 'U1',
      }),
      {
        ...buildInventarioItem({
          id: 'inv-2',
          productoId: 'prod-k',
          nombreProducto: 'Kiwi',
          cantidadActual: 2,
          cantidadMinima: 0,
          proveedorNombre: 'P',
          ubicacionNombre: 'U2',
        }),
        productoProveedor: {
          id: 'pp-k',
          producto: {
            id: 'prod-k',
            nombre: 'Kiwi',
            unidad: 'kg',
            contenido: 500,
            tipo: 'fruta',
          },
          proveedor: { id: 'pr', nombre: 'P' },
        },
      } as InventarioItem,
    ];

    const result = agregarInventarioPorProducto(items);

    expect(result).toHaveLength(1);
    expect(result[0].contenidoPorUnidad).toBe(500);
  });
});

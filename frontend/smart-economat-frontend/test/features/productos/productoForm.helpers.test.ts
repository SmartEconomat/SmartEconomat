import { describe, expect, it } from 'vitest';
import { CategoriaProducto } from '../../../src/services/producto.types';
import { buildProductoPayload } from '../../../src/features/productos/productoForm.helpers';

describe('productoForm.helpers', () => {
  it('normaliza el payload del producto y de sus proveedores', async () => {
    const payload = await buildProductoPayload({
      nombre: ' Tomate pera ',
      unidad: 'kg',
      tipo: CategoriaProducto.VERDURA,
      contenido: '2.5',
      codigoBarras: ' 123456 ',
      alergenos: ['gluten'],
      proveedores: [
        {
          proveedorId: 'proveedor-1',
          marca: ' Marca A ',
          codigoBarras: ' prov-123 ',
          precioUnitario: '1.25',
        },
      ],
    });

    expect(payload).toMatchObject({
      nombre: 'Tomate pera',
      unidad: 'KG',
      tipo: CategoriaProducto.VERDURA,
      contenido: 2.5,
      codigoBarras: '123456',
      alergenos: ['GLUTEN'],
      proveedores: [
        {
          proveedorId: 'proveedor-1',
          marcaEspecifica: 'Marca A',
          codigoBarras: 'prov-123',
          precioUnitario: 1.25,
        },
      ],
    });
  });

  it('rechaza proveedores sin precio unitario valido', async () => {
    await expect(
      buildProductoPayload({
        nombre: 'Aceite',
        unidad: 'L',
        contenido: 1,
        proveedores: [{ proveedorId: 'proveedor-1', precioUnitario: '' }],
      })
    ).rejects.toThrow(/precio unitario del proveedor 1/i);
  });
});

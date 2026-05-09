import { Producto } from '../../../src/modules/producto/producto.entity/producto.entity';
import { mapProductoToExcelRow } from '../../../src/modules/export/mappers/producto-export.mapper';
import {
  TipoProducto,
  UnidadMedida,
} from '../../../src/modules/producto/enums/producto.enums';

describe('ProductoExportMapper', () => {
  it('should map a full product correctly', () => {
    const mockProduct = {
      id: 'uuid-1',
      nombre: 'Producto Test',
      marca: 'Marca Test',
      tipo: TipoProducto.CARNE,
      unidad: UnidadMedida.KG,
      contenido: 1.5,
      codigoBarras: '123456789',
      descripcion: 'Descripción del producto',
      createdAt: new Date('2024-01-01T12:00:00Z'),
      proveedores: [
        { proveedor: { nombre: 'Proveedor A' } },
        { proveedor: { nombre: 'Proveedor B' } },
      ],
      alergenos: [{ alergeno: 'GLUTEN' }, { alergeno: 'LACTEOS' }],
    } as unknown as Producto;

    const result = mapProductoToExcelRow(mockProduct);

    expect(result).toEqual({
      id: 'uuid-1',
      nombre: 'Producto Test',
      marca: 'Marca Test',
      tipo: TipoProducto.CARNE,
      unidad: UnidadMedida.KG,
      contenido: 1.5,
      codigoBarras: '123456789',
      alergenos: 'GLUTEN, LACTEOS',
      proveedores: 'Proveedor A, Proveedor B',
      descripcion: 'Descripción del producto',
      createdAt: '2024-01-01',
    });
  });

  it('should handle missing fields gracefully', () => {
    const mockProduct = {
      id: 'uuid-2',
      nombre: 'Producto Minimal',
      proveedores: [],
      alergenos: [],
    } as unknown as Producto;

    const result = mapProductoToExcelRow(mockProduct);

    expect(result).toEqual({
      id: 'uuid-2',
      nombre: 'Producto Minimal',
      marca: '',
      tipo: '',
      unidad: '',
      contenido: 0,
      codigoBarras: '',
      alergenos: '',
      proveedores: '',
      descripcion: '',
      createdAt: '',
    });
  });

  it('should return empty object for null product', () => {
    const result = mapProductoToExcelRow(null as any);
    expect(result).toEqual({});
  });
});

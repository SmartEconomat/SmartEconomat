import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateProductoDto } from '../../../src/modules/producto/dto/create-producto.dto';
import { AddProveedorToProductoDto } from '../../../src/modules/producto/dto/producto-proveedor.dto/add-proveedor-to-producto.dto';

describe('DTOs - Alta compleja de producto', () => {
  it('acepta un payload válido con alérgenos y proveedores', () => {
    const dto = plainToInstance(CreateProductoDto, {
      nombre: 'Leche',
      unidad: 'L',
      contenido: 1,
      tipo: 'lacteo',
      alergenos: ['LACTEOS'],
      proveedores: [
        {
          proveedorId: '01954a87-0778-74d4-bb32-55b12044579f',
          precioUnitario: 1.45,
          marcaEspecifica: 'Pascual',
          codigoBarras: '5901234123457',
        },
      ],
    });

    const errors = validateSync(dto);

    expect(errors).toHaveLength(0);
  });

  it('rechaza la creación cuando falta la unidad obligatoria', () => {
    const dto = plainToInstance(CreateProductoDto, {
      nombre: 'Leche',
      contenido: 1,
    });

    const errors = validateSync(dto);

    expect(errors.some((error) => error.property === 'unidad')).toBe(true);
  });

  it('rechaza alérgenos fuera del enum compartido', () => {
    const dto = plainToInstance(CreateProductoDto, {
      nombre: 'Leche',
      unidad: 'L',
      contenido: 1,
      alergenos: ['LACTOSA'],
    });

    const errors = validateSync(dto);

    expect(errors.some((error) => error.property === 'alergenos')).toBe(true);
  });

  it('acepta un código de barras alfanumérico de producto', () => {
    const dto = plainToInstance(CreateProductoDto, {
      nombre: 'Leche',
      unidad: 'L',
      contenido: 1,
      codigoBarras: 'QAPNEBB8UX',
    });

    const errors = validateSync(dto);

    expect(errors.some((error) => error.property === 'codigoBarras')).toBe(
      false
    );
  });

  it('rechaza proveedores anidados inválidos dentro del payload de creación', () => {
    const dto = plainToInstance(CreateProductoDto, {
      nombre: 'Leche',
      unidad: 'L',
      contenido: 1,
      proveedores: [
        {
          proveedorId: 'proveedor-invalido',
          precioUnitario: -2,
        },
      ],
    });

    const errors = validateSync(dto);

    expect(errors.some((error) => error.property === 'proveedores')).toBe(true);
  });

  it('rechaza un proveedor sin UUID v7 válido', () => {
    const dto = plainToInstance(AddProveedorToProductoDto, {
      proveedorId: 'proveedor-invalido',
      precioUnitario: 1.45,
    });

    const errors = validateSync(dto);

    expect(errors.some((error) => error.property === 'proveedorId')).toBe(true);
  });

  it('acepta códigos de barras alfanuméricos de proveedor', () => {
    const dto = plainToInstance(AddProveedorToProductoDto, {
      proveedorId: '01954a87-0778-74d4-bb32-55b12044579f',
      precioUnitario: 1.45,
      codigoBarras: 'PROV-12345',
    });

    const errors = validateSync(dto);

    expect(errors.some((error) => error.property === 'codigoBarras')).toBe(
      false
    );
  });

  it('rechaza precios unitarios negativos', () => {
    const dto = plainToInstance(AddProveedorToProductoDto, {
      proveedorId: '01954a87-0778-74d4-bb32-55b12044579f',
      precioUnitario: -1,
    });

    const errors = validateSync(dto);

    expect(errors.some((error) => error.property === 'precioUnitario')).toBe(
      true
    );
  });

  it('rechaza precios unitarios en 0', () => {
    const dto = plainToInstance(AddProveedorToProductoDto, {
      proveedorId: '01954a87-0778-74d4-bb32-55b12044579f',
      precioUnitario: 0,
    });

    const errors = validateSync(dto);

    expect(errors.some((error) => error.property === 'precioUnitario')).toBe(
      true
    );
  });
});

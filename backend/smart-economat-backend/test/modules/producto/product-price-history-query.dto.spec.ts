import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { ProductPriceHistoryQueryDto } from '../../../src/modules/producto/dto/product-price-history-query.dto';

describe('ProductPriceHistoryQueryDto', () => {
  it('acepta proveedorId ausente al ser opcional', () => {
    const dto = plainToInstance(ProductPriceHistoryQueryDto, {});
    const errors = validateSync(dto);

    expect(errors).toHaveLength(0);
  });

  it('acepta proveedorId UUID valido', () => {
    const dto = plainToInstance(ProductPriceHistoryQueryDto, {
      proveedorId: '01954a85-6215-7f83-8e5c-2b6fd3d6a4b1',
    });
    const errors = validateSync(dto);

    expect(errors).toHaveLength(0);
  });

  it('rechaza proveedorId malformado', () => {
    const dto = plainToInstance(ProductPriceHistoryQueryDto, {
      proveedorId: 'proveedor-invalido',
    });
    const errors = validateSync(dto);

    expect(errors.some((error) => error.property === 'proveedorId')).toBe(true);
  });
});

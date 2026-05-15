import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpsertPedidoDraftDto } from '../../../src/modules/pedido-draft/dto/upsert-pedido-draft.dto';

/**
 * Tests de regresión para PEDIDO-DRAFT-002:
 * El payload del borrador no debe superar 64 KB serializado.
 */
describe('UpsertPedidoDraftDto — límite de tamaño de payload', () => {
  it('acepta un payload pequeño', async () => {
    const dto = plainToInstance(UpsertPedidoDraftDto, {
      payload: { lineas: [{ productoId: 'uuid-1', cantidad: 5 }] },
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('acepta un payload en el límite (exactamente ~64 KB)', async () => {
    const bigArray = Array.from({ length: 500 }, (_, i) => ({
      productoId: `prod-${i}`,
      cantidad: i,
      notas: 'x'.repeat(50),
    }));
    const dto = plainToInstance(UpsertPedidoDraftDto, {
      payload: { lineas: bigArray },
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rechaza un payload superior a 64 KB', () => {
    const huge = 'x'.repeat(65 * 1024);
    expect(() => {
      plainToInstance(UpsertPedidoDraftDto, { payload: { data: huge } });
    }).toThrow();
  });

  it('rechaza un payload que no es objeto', async () => {
    const dto = plainToInstance(UpsertPedidoDraftDto, { payload: 'cadena' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('payload');
  });
});

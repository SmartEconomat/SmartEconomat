import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateMovimientoManualDto } from '../../../src/modules/inventario/dto/create-movimiento-manual.dto';
import { TipoMovimientoManual } from '../../../src/modules/movimiento/enums/movimiento.enums';

describe('CreateMovimientoManualDto', () => {
  const validPayload = {
    inventarioId: '01954a87-0778-74d4-bb32-55b12044579f',
    tipo: TipoMovimientoManual.SALIDA_AJUSTE,
    ajuste: -2.5,
    motivo: 'Rotura interna',
    observaciones: 'Envase dañado en cámara fría',
  };

  it('acepta un payload válido para ajuste manual', () => {
    const dto = plainToInstance(CreateMovimientoManualDto, validPayload);

    const errors = validateSync(dto);

    expect(errors).toHaveLength(0);
  });

  it('rechaza inventarioId sin UUID v7', () => {
    const dto = plainToInstance(CreateMovimientoManualDto, {
      ...validPayload,
      inventarioId: 'inventario-invalido',
    });

    const errors = validateSync(dto);

    expect(errors.some((error) => error.property === 'inventarioId')).toBe(
      true
    );
  });

  it('rechaza tipos fuera del enum compartido', () => {
    const dto = plainToInstance(CreateMovimientoManualDto, {
      ...validPayload,
      tipo: 'merma_no_valida',
    });

    const errors = validateSync(dto);

    expect(errors.some((error) => error.property === 'tipo')).toBe(true);
  });

  it('rechaza ajuste igual a 0', () => {
    const dto = plainToInstance(CreateMovimientoManualDto, {
      ...validPayload,
      ajuste: 0,
    });

    const errors = validateSync(dto);

    expect(errors.some((error) => error.property === 'ajuste')).toBe(true);
  });

  it('rechaza motivo vacío', () => {
    const dto = plainToInstance(CreateMovimientoManualDto, {
      ...validPayload,
      motivo: '',
    });

    const errors = validateSync(dto);

    expect(errors.some((error) => error.property === 'motivo')).toBe(true);
  });

  it('rechaza observaciones que exceden la longitud máxima', () => {
    const dto = plainToInstance(CreateMovimientoManualDto, {
      ...validPayload,
      observaciones: 'x'.repeat(501),
    });

    const errors = validateSync(dto);

    expect(errors.some((error) => error.property === 'observaciones')).toBe(
      true
    );
  });
});

import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { RecetaListQueryDto } from '../../../src/modules/receta/dto/receta-list-query.dto';

describe('RecetaListQueryDto', () => {
  it('acepta la query vacía (todos los filtros son opcionales)', () => {
    const dto = plainToInstance(RecetaListQueryDto, {});
    const errors = validateSync(dto);

    expect(errors).toHaveLength(0);
    expect(dto.minTiempoMinutos).toBeUndefined();
    expect(dto.maxTiempoMinutos).toBeUndefined();
  });

  it('acepta valores válidos >= 10', () => {
    const dto = plainToInstance(RecetaListQueryDto, {
      minTiempoMinutos: '10',
      maxTiempoMinutos: '60',
    });
    const errors = validateSync(dto);

    expect(errors).toHaveLength(0);
    expect(dto.minTiempoMinutos).toBe(10);
    expect(dto.maxTiempoMinutos).toBe(60);
  });

  it('rechaza minTiempoMinutos < 10', () => {
    const dto = plainToInstance(RecetaListQueryDto, {
      minTiempoMinutos: '9',
    });
    const errors = validateSync(dto);

    expect(errors.some((e) => e.property === 'minTiempoMinutos')).toBe(true);
  });

  it('rechaza maxTiempoMinutos < 10', () => {
    const dto = plainToInstance(RecetaListQueryDto, {
      maxTiempoMinutos: '5',
    });
    const errors = validateSync(dto);

    expect(errors.some((e) => e.property === 'maxTiempoMinutos')).toBe(true);
  });

  it('rechaza valores no enteros', () => {
    const dto = plainToInstance(RecetaListQueryDto, {
      minTiempoMinutos: '10.5',
    });
    const errors = validateSync(dto);

    expect(errors.some((e) => e.property === 'minTiempoMinutos')).toBe(true);
  });

  it('convierte strings numéricos a number via @Type', () => {
    const dto = plainToInstance(RecetaListQueryDto, {
      minTiempoMinutos: '30',
      maxTiempoMinutos: '120',
    });

    expect(typeof dto.minTiempoMinutos).toBe('number');
    expect(typeof dto.maxTiempoMinutos).toBe('number');
  });
});

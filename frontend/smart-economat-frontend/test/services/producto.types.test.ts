import { describe, expect, it } from 'vitest';
import {
  normalizeAlergeno,
  normalizeUnidadMedida,
  UnidadMedida,
} from '../../src/services/producto.types';

describe('producto.types normalizers', () => {
  it('normaliza unidades válidas y rechaza valores fuera de contrato', () => {
    expect(normalizeUnidadMedida('kg')).toBe(UnidadMedida.KG);
    expect(normalizeUnidadMedida('ML')).toBe(UnidadMedida.ML);
    expect(normalizeUnidadMedida('metro')).toBeUndefined();
  });

  it('normaliza alérgenos válidos y filtra valores inválidos', () => {
    expect(normalizeAlergeno('gluten')).toBe('GLUTEN');
    expect(normalizeAlergeno('mostaza')).toBe('MOSTAZA');
    expect(normalizeAlergeno('lactosa')).toBeUndefined();
  });
});

import { NullableColumnNumericTransformer } from '../../../src/common/transformers/nullable-column-numeric.transformer';

describe('NullableColumnNumericTransformer', () => {
  const t = new NullableColumnNumericTransformer();

  it('to(null) debe persistir como NULL conceptual (no fuerza 0)', () => {
    expect(t.to(null)).toBeNull();
    expect(t.to(undefined)).toBeNull();
  });

  it('to debe normalizar número finito', () => {
    expect(t.to(5)).toBe(5);
  });

  it('from debe mapear NULL/vacío a null', () => {
    expect(t.from(null)).toBeNull();
    expect(t.from(undefined)).toBeNull();
    expect(t.from('')).toBeNull();
  });

  it('from debe parsear string numérico', () => {
    expect(t.from('12.5')).toBe(12.5);
    expect(t.from(12.5)).toBe(12.5);
  });
});

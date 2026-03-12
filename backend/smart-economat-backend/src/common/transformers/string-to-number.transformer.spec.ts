import { StringToNumberTransformer } from './string-to-number.transformer';

/**
 * Tests Unitarios de StringToNumberTransformer
 */
describe('StringToNumberTransformer', () => {
  describe('transform()', () => {
    it('debe convertir string numérico a número', () => {
      const params = { value: '123' };
      expect(StringToNumberTransformer.transform(params)).toBe(123);
    });

    it('debe convertir string con decimales', () => {
      const params = { value: '123.45' };
      expect(StringToNumberTransformer.transform(params)).toBe(123.45);
    });

    it('debe convertir string con trim', () => {
      const params = { value: '  123  ' };
      expect(StringToNumberTransformer.transform(params)).toBe(123);
    });

    it('debe manejar número directo', () => {
      const params = { value: 123 };
      expect(StringToNumberTransformer.transform(params)).toBe(123);
    });

    it('debe manejar número negativo', () => {
      const params = { value: '-123' };
      expect(StringToNumberTransformer.transform(params)).toBe(-123);
    });

    it('debe manejar cero', () => {
      const params = { value: '0' };
      expect(StringToNumberTransformer.transform(params)).toBe(0);
    });

    it('debe retornar undefined si el valor es undefined', () => {
      const params = { value: undefined };
      expect(StringToNumberTransformer.transform(params)).toBeUndefined();
    });

    it('debe retornar undefined si el valor es null', () => {
      const params = { value: null };
      expect(StringToNumberTransformer.transform(params)).toBeNull();
    });

    it('debe retornar undefined si el string está vacío', () => {
      const params = { value: '' };
      expect(StringToNumberTransformer.transform(params)).toBeUndefined();
    });

    it('debe retornar undefined si el string solo tiene espacios', () => {
      const params = { value: '   ' };
      expect(StringToNumberTransformer.transform(params)).toBeUndefined();
    });

    it('debe lanzar error si el string no es numérico', () => {
      const params = { value: 'abc' };
      expect(() => StringToNumberTransformer.transform(params)).toThrow(
        "El valor 'abc' no puede ser convertido a número"
      );
    });

    it('debe lanzar error si el string es mixto', () => {
      const params = { value: '123abc' };
      expect(() => StringToNumberTransformer.transform(params)).toThrow();
    });

    it('debe manejar notación científica', () => {
      const params = { value: '1.23e5' };
      expect(StringToNumberTransformer.transform(params)).toBe(1.23e5);
    });

    it('debe manejar números muy grandes', () => {
      const params = { value: '999999999999999999' };
      expect(StringToNumberTransformer.transform(params)).toBe(
        999999999999999999
      );
    });
  });
});

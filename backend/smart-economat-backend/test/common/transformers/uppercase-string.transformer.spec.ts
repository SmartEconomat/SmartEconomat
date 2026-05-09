import { UppercaseStringTransformer } from '../../../src/common/transformers/uppercase-string.transformer';

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
describe('UppercaseStringTransformer', () => {
  describe('transform()', () => {
    it('debe convertir a mayúsculas con trim', () => {
      const params = { value: '  hello World  ' };
      expect(UppercaseStringTransformer.transform(params)).toBe('HELLO WORLD');
    });

    it('debe manejar string ya en mayúsculas', () => {
      const params = { value: 'HELLO WORLD' };
      expect(UppercaseStringTransformer.transform(params)).toBe('HELLO WORLD');
    });

    it('debe manejar string vacío', () => {
      const params = { value: '' };
      expect(UppercaseStringTransformer.transform(params)).toBe('');
    });

    it('debe retornar undefined si el valor es undefined', () => {
      const params = { value: undefined };
      expect(UppercaseStringTransformer.transform(params)).toBeUndefined();
    });

    it('debe retornar null si el valor es null', () => {
      const params = { value: null };
      expect(UppercaseStringTransformer.transform(params)).toBeNull();
    });

    it('debe retornar el mismo valor si no es string', () => {
      const paramsNumber = { value: 123 };
      expect(UppercaseStringTransformer.transform(paramsNumber)).toBe(123);

      const paramsObject = { value: { key: 'value' } };
      expect(UppercaseStringTransformer.transform(paramsObject)).toEqual({
        key: 'value',
      });
    });

    it('debe manejar string con caracteres especiales', () => {
      const params = { value: '  hólá múndò  ' };
      expect(UppercaseStringTransformer.transform(params)).toBe('HÓLÁ MÚNDÒ');
    });

    it('debe manejar código de producto', () => {
      const params = { value: '  abc-123  ' };
      expect(UppercaseStringTransformer.transform(params)).toBe('ABC-123');
    });
  });
});

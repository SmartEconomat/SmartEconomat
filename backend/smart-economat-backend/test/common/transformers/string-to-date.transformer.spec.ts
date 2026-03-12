import { StringToDateTransformer } from 'src/common/transformers/string-to-date.transformer';
import { TransformFnParams } from 'class-transformer/types/interfaces';

/**
 * Tests Unitarios de StringToDateTransformer
 */
describe('StringToDateTransformer', () => {
  describe('transform()', () => {
    it('debe convertir string ISO a Date', () => {
      const params = { value: '2024-01-15T10:30:00.000Z' } as TransformFnParams;
      const result = StringToDateTransformer.transform(params) as Date;
      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toBe('2024-01-15T10:30:00.000Z');
    });

    it('debe convertir string de fecha a Date', () => {
      const params = { value: '2024-01-15' } as TransformFnParams;
      const result = StringToDateTransformer.transform(params) as Date;
      expect(result).toBeInstanceOf(Date);
    });

    it('debe manejar Date directo', () => {
      const date = new Date('2024-01-15T10:30:00.000Z');
      const params = { value: date } as TransformFnParams;
      expect(StringToDateTransformer.transform(params)).toBe(date);
    });

    it('debe convertir timestamp a Date', () => {
      const timestamp = 1705315800000;
      const params = { value: timestamp } as TransformFnParams;
      const result = StringToDateTransformer.transform(params) as Date;
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBe(timestamp);
    });

    it('debe retornar undefined si el valor es undefined', () => {
      const params = { value: undefined } as TransformFnParams;
      expect(StringToDateTransformer.transform(params)).toBeUndefined();
    });

    it('debe retornar undefined si el valor es null', () => {
      const params = { value: null } as TransformFnParams;
      expect(StringToDateTransformer.transform(params)).toBeNull();
    });

    it('debe retornar undefined si el string está vacío', () => {
      const params = { value: '' } as TransformFnParams;
      expect(StringToDateTransformer.transform(params)).toBeUndefined();
    });

    it('debe retornar undefined si el string solo tiene espacios', () => {
      const params = { value: '   ' } as TransformFnParams;
      expect(StringToDateTransformer.transform(params)).toBeUndefined();
    });

    it('debe lanzar error si la fecha es inválida', () => {
      const params = { value: 'fecha-invalida' } as TransformFnParams;
      expect(() => StringToDateTransformer.transform(params)).toThrow(
        "El valor 'fecha-invalida' no puede ser convertido a fecha"
      );
    });

    it('debe lanzar error si el timestamp es NaN', () => {
      const params = { value: NaN } as TransformFnParams;
      expect(() => StringToDateTransformer.transform(params)).toThrow(
        "El timestamp 'NaN' no es una fecha válida"
      );
    });

    it('debe manejar string con trim', () => {
      const params = {
        value: '  2024-01-15T10:30:00.000Z  ',
      } as TransformFnParams;
      const result = StringToDateTransformer.transform(params);
      expect(result).toBeInstanceOf(Date);
    });

    it('debe rechazar Date inválido', () => {
      const invalidDate = new Date('invalid');
      const params = { value: invalidDate } as TransformFnParams;
      const result = StringToDateTransformer.transform(params);
      expect(result).toBeUndefined();
    });

    it('debe manejar fecha con timezone', () => {
      const params = {
        value: '2024-01-15T10:30:00+05:00',
      } as TransformFnParams;
      const result = StringToDateTransformer.transform(params);
      expect(result).toBeInstanceOf(Date);
    });

    it('debe manejar fecha en formato MM/DD/YYYY', () => {
      const params = { value: '01/15/2024' } as TransformFnParams;
      const result = StringToDateTransformer.transform(params);
      expect(result).toBeInstanceOf(Date);
    });
  });
});

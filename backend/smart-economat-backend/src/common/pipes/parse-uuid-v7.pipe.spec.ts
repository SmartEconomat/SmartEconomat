import { ParseUUIDv7Pipe } from './parse-uuid-v7.pipe';
import { BadRequestException } from '@nestjs/common';
import { I18nHelper } from '../helpers/i18n.helper';

/**
 * Tests Unitarios de ParseUUIDv7Pipe
 */
describe('ParseUUIDv7Pipe', () => {
  const pipe = new ParseUUIDv7Pipe();

  beforeAll(() => {
    jest.spyOn(I18nHelper, 'getError').mockImplementation((key: string) => {
      const messages: Record<string, string> = {
        EL_UUID_NO_PUEDE_ESTAR_VAC_O: 'El UUID no puede estar vacío',
      };
      return messages[key] || key;
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('transform()', () => {
    it('debe aceptar UUID v7 válido (minúsculas)', () => {
      const uuid = '018f4e2a-1234-7abc-bdef-0123456789ab';
      expect(pipe.transform(uuid)).toBe(uuid);
    });

    it('debe aceptar UUID v7 válido (mayúsculas)', () => {
      const uuid = '018F4E2A-1234-7ABC-BDEF-0123456789AB';
      expect(pipe.transform(uuid)).toBe(uuid);
    });

    it('debe aceptar UUID v7 válido con variante "a"', () => {
      const uuid = '018f4e2a-1234-7abc-adef-0123456789ab';
      expect(pipe.transform(uuid)).toBe(uuid);
    });

    it('debe aceptar UUID v7 válido con variante "b"', () => {
      const uuid = '018f4e2a-1234-7abc-bdef-0123456789ab';
      expect(pipe.transform(uuid)).toBe(uuid);
    });

    it('debe aceptar UUID v7 válido con variante "8"', () => {
      const uuid = '018f4e2a-1234-7abc-8def-0123456789ab';
      expect(pipe.transform(uuid)).toBe(uuid);
    });

    it('debe aceptar UUID v7 válido con variante "9"', () => {
      const uuid = '018f4e2a-1234-7abc-9def-0123456789ab';
      expect(pipe.transform(uuid)).toBe(uuid);
    });

    it('debe rechazar UUID v4', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      expect(() => pipe.transform(uuid)).toThrow(BadRequestException);
      expect(() => pipe.transform(uuid)).toThrow(
        "El valor '550e8400-e29b-41d4-a716-446655440000' no es un UUID v7 válido"
      );
    });

    it('debe rechazar UUID v1', () => {
      const uuid = 'c232ab00-9414-11ec-b3c8-2f9a4d0a7c3e';
      expect(() => pipe.transform(uuid)).toThrow(BadRequestException);
    });

    it('debe rechazar UUID v3', () => {
      const uuid = '6fa459ea-ee8a-3ca4-894e-db77e5153de1';
      expect(() => pipe.transform(uuid)).toThrow(BadRequestException);
    });

    it('debe rechazar UUID v5', () => {
      const uuid = '886313e1-3b8a-5372-9b90-0c9aee199e5d';
      expect(() => pipe.transform(uuid)).toThrow(BadRequestException);
    });

    it('debe rechazar string vacío', () => {
      expect(() => pipe.transform('')).toThrow(BadRequestException);
      expect(() => pipe.transform('')).toThrow('El UUID no puede estar vacío');
    });

    it('debe rechazar undefined', () => {
      expect(() => pipe.transform(undefined)).toThrow(BadRequestException);
      expect(() => pipe.transform(undefined)).toThrow(
        'El UUID no puede estar vacío'
      );
    });

    it('debe rechazar null', () => {
      expect(() => pipe.transform(null as unknown as string)).toThrow(
        BadRequestException
      );
    });

    it('debe rechazar "draft"', () => {
      expect(() => pipe.transform('draft')).toThrow(BadRequestException);
      expect(() => pipe.transform('draft')).toThrow(
        "El valor 'draft' no es un UUID v7 válido"
      );
    });

    it('debe rechazar formato inválido', () => {
      expect(() => pipe.transform('invalid-uuid')).toThrow(BadRequestException);
    });

    it('debe rechazar UUID con longitud incorrecta', () => {
      const uuid = '018f4e2a-1234-7abc-bdef';
      expect(() => pipe.transform(uuid)).toThrow(BadRequestException);
    });

    it('debe rechazar UUID sin guiones', () => {
      const uuid = '018f4e2a12347abcdef0123456789ab';
      expect(() => pipe.transform(uuid)).toThrow(BadRequestException);
    });

    it('debe rechazar UUID con caracteres inválidos', () => {
      const uuid = '018f4e2a-1234-7abc-bdef-0123456789gh';
      expect(() => pipe.transform(uuid)).toThrow(BadRequestException);
    });

    it('debe rechazar UUID v7 con variante incorrecta (c)', () => {
      const uuid = '018f4e2a-1234-7abc-cdef-0123456789ab';
      expect(() => pipe.transform(uuid)).toThrow(BadRequestException);
    });

    it('debe rechazar UUID v7 con variante incorrecta (d)', () => {
      const uuid = '018f4e2a-1234-7abc-ddef-0123456789ab';
      expect(() => pipe.transform(uuid)).toThrow(BadRequestException);
    });

    it('debe rechazar UUID v7 con variante incorrecta (e)', () => {
      const uuid = '018f4e2a-1234-7abc-eef-0123456789ab';
      expect(() => pipe.transform(uuid)).toThrow(BadRequestException);
    });

    it('debe rechazar UUID v7 con variante incorrecta (f)', () => {
      const uuid = '018f4e2a-1234-7abc-fdef-0123456789ab';
      expect(() => pipe.transform(uuid)).toThrow(BadRequestException);
    });

    it('debe rechazar UUID con versión incorrecta (0-6)', () => {
      for (let version = 0; version <= 6; version++) {
        const uuid = `018f4e2a-1234-${version}abc-bdef-0123456789ab`;
        expect(() => pipe.transform(uuid)).toThrow(BadRequestException);
      }
    });

    it('debe rechazar UUID con versión incorrecta (8-f)', () => {
      for (let version = 8; version <= 15; version++) {
        const hexVersion = version.toString(16);
        const uuid = `018f4e2a-1234-${hexVersion}abc-bdef-0123456789ab`;
        expect(() => pipe.transform(uuid)).toThrow(BadRequestException);
      }
    });

    it('debe retornar el mismo UUID que recibió', () => {
      const uuid = '018f4e2a-1234-7abc-bdef-0123456789ab';
      const result = pipe.transform(uuid);
      expect(result).toBe(uuid);
      expect(result).toEqual(uuid);
    });
  });

  describe('Validación con regex', () => {
    it('debe validar UUID v7 con el patrón correcto', () => {
      const validUUIDs = [
        '018f4e2a-1234-7abc-bdef-0123456789ab',
        '018F4E2A-1234-7ABC-BDEF-0123456789AB',
        '00000000-0000-7000-8000-000000000000',
        'ffffffff-ffff-7fff-bfff-ffffffffffff',
      ];

      validUUIDs.forEach((uuid) => {
        expect(() => pipe.transform(uuid)).not.toThrow();
      });
    });
  });

  describe('Casos borde', () => {
    it('debe manejar UUID con espacios en blanco', () => {
      const uuid = ' 018f4e2a-1234-7abc-bdef-0123456789ab ';
      expect(() => pipe.transform(uuid)).toThrow(BadRequestException);
    });

    it('debe manejar UUID con guiones adicionales', () => {
      const uuid = '018f4e2a-1234-7abc-bdef-0123456789ab-';
      expect(() => pipe.transform(uuid)).toThrow(BadRequestException);
    });

    it('debe manejar UUID sin último grupo', () => {
      const uuid = '018f4e2a-1234-7abc-bdef';
      expect(() => pipe.transform(uuid)).toThrow(BadRequestException);
    });
  });
});

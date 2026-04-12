import {
  calculateCheckDigit,
  generateEan13,
  validateEan13,
} from '../../../src/common/utils/ean13.util';

describe('EAN-13 Utils', () => {
  describe('calculateCheckDigit', () => {
    it('debe calcular correctamente el dígito de control', () => {
      expect(calculateCheckDigit('200123456789')).toBe(3);
    });

    it('debe lanzar error si la longitud no es de 12 dígitos', () => {
      expect(() => calculateCheckDigit('123')).toThrow();
      expect(() => calculateCheckDigit('a00123456789')).toThrow();
    });
  });

  describe('generateEan13', () => {
    it('debe generar un código de 13 dígitos', () => {
      const code = generateEan13();
      expect(code).toHaveLength(13);
      expect(/^\d{13}$/.test(code)).toBe(true);
    });

    it('debe usar el prefijo por defecto (200)', () => {
      const code = generateEan13();
      expect(code.startsWith('200')).toBe(true);
    });

    it('debe usar un prefijo personalizado', () => {
      const code = generateEan13('299');
      expect(code.startsWith('299')).toBe(true);
    });

    it('debe tener un dígito de control correcto', () => {
      const code = generateEan13();
      expect(validateEan13(code)).toBe(true);
    });
  });

  describe('validateEan13', () => {
    it('debe validar un código EAN-13 correcto', () => {
      expect(validateEan13('2001234567893')).toBe(true);
    });

    it('debe rechazar un código con checksum incorrecto', () => {
      expect(validateEan13('2001234567890')).toBe(false);
    });

    it('debe rechazar un código de longitud incorrecta', () => {
      expect(validateEan13('123')).toBe(false);
      expect(validateEan13('20012345678945')).toBe(false);
    });

    it('debe rechazar si no son todo números', () => {
      expect(validateEan13('200123456789A')).toBe(false);
    });
  });
});

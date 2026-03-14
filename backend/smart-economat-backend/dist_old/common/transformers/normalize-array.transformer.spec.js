'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
const _normalizearraytransformer = require('./normalize-array.transformer');
/**
 * Tests Unitarios de NormalizeArrayTransformer
 */ describe('NormalizeArrayTransformer', () => {
  describe('transform()', () => {
    it('debe manejar array de strings', () => {
      const params = {
        value: ['apple', 'banana', 'cherry'],
      };
      expect(
        _normalizearraytransformer.NormalizeArrayTransformer.transform(params)
      ).toEqual(['apple', 'banana', 'cherry']);
    });
    it('debe aplicar trim a strings en array', () => {
      const params = {
        value: ['  apple  ', '  banana  ', '  cherry  '],
      };
      expect(
        _normalizearraytransformer.NormalizeArrayTransformer.transform(params)
      ).toEqual(['apple', 'banana', 'cherry']);
    });
    it('debe filtrar elementos null/undefined del array', () => {
      const params = {
        value: ['apple', null, 'banana', undefined, 'cherry'],
      };
      expect(
        _normalizearraytransformer.NormalizeArrayTransformer.transform(params)
      ).toEqual(['apple', 'banana', 'cherry']);
    });
    it('debe convertir string separado por comas a array', () => {
      const params = {
        value: 'apple,banana,cherry',
      };
      expect(
        _normalizearraytransformer.NormalizeArrayTransformer.transform(params)
      ).toEqual(['apple', 'banana', 'cherry']);
    });
    it('debe aplicar trim al dividir por comas', () => {
      const params = {
        value: '  apple  ,  banana  ,  cherry  ',
      };
      expect(
        _normalizearraytransformer.NormalizeArrayTransformer.transform(params)
      ).toEqual(['apple', 'banana', 'cherry']);
    });
    it('debe manejar string vacío', () => {
      const params = {
        value: '',
      };
      expect(
        _normalizearraytransformer.NormalizeArrayTransformer.transform(params)
      ).toBeUndefined();
    });
    it('debe manejar string solo con espacios', () => {
      const params = {
        value: '   ',
      };
      expect(
        _normalizearraytransformer.NormalizeArrayTransformer.transform(params)
      ).toBeUndefined();
    });
    it('debe convertir un solo elemento a array', () => {
      const params = {
        value: 'single',
      };
      expect(
        _normalizearraytransformer.NormalizeArrayTransformer.transform(params)
      ).toEqual(['single']);
    });
    it('debe retornar undefined si el valor es undefined', () => {
      const params = {
        value: undefined,
      };
      expect(
        _normalizearraytransformer.NormalizeArrayTransformer.transform(params)
      ).toBeUndefined();
    });
    it('debe retornar null si el valor es null', () => {
      const params = {
        value: null,
      };
      expect(
        _normalizearraytransformer.NormalizeArrayTransformer.transform(params)
      ).toBeNull();
    });
    it('debe manejar array vacío', () => {
      const params = {
        value: [],
      };
      expect(
        _normalizearraytransformer.NormalizeArrayTransformer.transform(params)
      ).toEqual([]);
    });
    it('debe manejar array con elementos no string', () => {
      const params = {
        value: [1, 2, 3],
      };
      expect(
        _normalizearraytransformer.NormalizeArrayTransformer.transform(params)
      ).toEqual([1, 2, 3]);
    });
    it('debe manejar array mixto', () => {
      const params = {
        value: ['apple', 123, 'banana'],
      };
      expect(
        _normalizearraytransformer.NormalizeArrayTransformer.transform(params)
      ).toEqual(['apple', 123, 'banana']);
    });
    it('debe manejar string con comas múltiples', () => {
      const params = {
        value: 'apple,,banana,,cherry',
      };
      expect(
        _normalizearraytransformer.NormalizeArrayTransformer.transform(params)
      ).toEqual(['apple', 'banana', 'cherry']);
    });
    it('debe manejar string con una sola coma', () => {
      const params = {
        value: ',',
      };
      expect(
        _normalizearraytransformer.NormalizeArrayTransformer.transform(params)
      ).toEqual([]);
    });
  });
});

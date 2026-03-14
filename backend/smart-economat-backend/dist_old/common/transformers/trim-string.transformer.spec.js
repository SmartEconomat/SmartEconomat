'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
const _trimstringtransformer = require('./trim-string.transformer');
/**
 * Tests Unitarios de TrimStringTransformer
 */ describe('TrimStringTransformer', () => {
  describe('transform()', () => {
    it('debe eliminar espacios al inicio y final', () => {
      const params = {
        value: '  hello world  ',
      };
      expect(
        _trimstringtransformer.TrimStringTransformer.transform(params)
      ).toBe('hello world');
    });
    it('debe manejar string sin espacios', () => {
      const params = {
        value: 'hello world',
      };
      expect(
        _trimstringtransformer.TrimStringTransformer.transform(params)
      ).toBe('hello world');
    });
    it('debe manejar string solo con espacios', () => {
      const params = {
        value: '   ',
      };
      expect(
        _trimstringtransformer.TrimStringTransformer.transform(params)
      ).toBe('');
    });
    it('debe manejar string vacío', () => {
      const params = {
        value: '',
      };
      expect(
        _trimstringtransformer.TrimStringTransformer.transform(params)
      ).toBe('');
    });
    it('debe retornar undefined si el valor es undefined', () => {
      const params = {
        value: undefined,
      };
      expect(
        _trimstringtransformer.TrimStringTransformer.transform(params)
      ).toBeUndefined();
    });
    it('debe retornar null si el valor es null', () => {
      const params = {
        value: null,
      };
      expect(
        _trimstringtransformer.TrimStringTransformer.transform(params)
      ).toBeNull();
    });
    it('debe retornar el mismo valor si no es string', () => {
      const paramsNumber = {
        value: 123,
      };
      expect(
        _trimstringtransformer.TrimStringTransformer.transform(paramsNumber)
      ).toBe(123);
      const paramsObject = {
        value: {
          key: 'value',
        },
      };
      expect(
        _trimstringtransformer.TrimStringTransformer.transform(paramsObject)
      ).toEqual({
        key: 'value',
      });
      const paramsArray = {
        value: [1, 2, 3],
      };
      expect(
        _trimstringtransformer.TrimStringTransformer.transform(paramsArray)
      ).toEqual([1, 2, 3]);
    });
    it('debe manejar string con tabs y newlines', () => {
      const params = {
        value: '\t\n  hello world  \n\t',
      };
      expect(
        _trimstringtransformer.TrimStringTransformer.transform(params)
      ).toBe('hello world');
    });
    it('debe manejar string con espacios múltiples internos', () => {
      const params = {
        value: '  hello   world  ',
      };
      expect(
        _trimstringtransformer.TrimStringTransformer.transform(params)
      ).toBe('hello   world');
    });
  });
});

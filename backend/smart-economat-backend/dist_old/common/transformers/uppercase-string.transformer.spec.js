"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _uppercasestringtransformer = require("./uppercase-string.transformer");
/**
 * Tests Unitarios de UppercaseStringTransformer
 */ describe('UppercaseStringTransformer', ()=>{
    describe('transform()', ()=>{
        it('debe convertir a mayúsculas con trim', ()=>{
            const params = {
                value: '  hello World  '
            };
            expect(_uppercasestringtransformer.UppercaseStringTransformer.transform(params)).toBe('HELLO WORLD');
        });
        it('debe manejar string ya en mayúsculas', ()=>{
            const params = {
                value: 'HELLO WORLD'
            };
            expect(_uppercasestringtransformer.UppercaseStringTransformer.transform(params)).toBe('HELLO WORLD');
        });
        it('debe manejar string vacío', ()=>{
            const params = {
                value: ''
            };
            expect(_uppercasestringtransformer.UppercaseStringTransformer.transform(params)).toBe('');
        });
        it('debe retornar undefined si el valor es undefined', ()=>{
            const params = {
                value: undefined
            };
            expect(_uppercasestringtransformer.UppercaseStringTransformer.transform(params)).toBeUndefined();
        });
        it('debe retornar null si el valor es null', ()=>{
            const params = {
                value: null
            };
            expect(_uppercasestringtransformer.UppercaseStringTransformer.transform(params)).toBeNull();
        });
        it('debe retornar el mismo valor si no es string', ()=>{
            const paramsNumber = {
                value: 123
            };
            expect(_uppercasestringtransformer.UppercaseStringTransformer.transform(paramsNumber)).toBe(123);
            const paramsObject = {
                value: {
                    key: 'value'
                }
            };
            expect(_uppercasestringtransformer.UppercaseStringTransformer.transform(paramsObject)).toEqual({
                key: 'value'
            });
        });
        it('debe manejar string con caracteres especiales', ()=>{
            const params = {
                value: '  hólá múndò  '
            };
            expect(_uppercasestringtransformer.UppercaseStringTransformer.transform(params)).toBe('HÓLÁ MÚNDÒ');
        });
        it('debe manejar código de producto', ()=>{
            const params = {
                value: '  abc-123  '
            };
            expect(_uppercasestringtransformer.UppercaseStringTransformer.transform(params)).toBe('ABC-123');
        });
    });
});

//# sourceMappingURL=uppercase-string.transformer.spec.js.map
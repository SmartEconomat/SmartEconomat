"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _lowercasestringtransformer = require("./lowercase-string.transformer");
/**
 * Tests Unitarios de LowercaseStringTransformer
 */ describe('LowercaseStringTransformer', ()=>{
    describe('transform()', ()=>{
        it('debe convertir a minúsculas con trim', ()=>{
            const params = {
                value: '  HELLO WORLD  '
            };
            expect(_lowercasestringtransformer.LowercaseStringTransformer.transform(params)).toBe('hello world');
        });
        it('debe manejar string ya en minúsculas', ()=>{
            const params = {
                value: 'hello world'
            };
            expect(_lowercasestringtransformer.LowercaseStringTransformer.transform(params)).toBe('hello world');
        });
        it('debe manejar email con mayúsculas', ()=>{
            const params = {
                value: '  JOHN.DOE@EXAMPLE.COM  '
            };
            expect(_lowercasestringtransformer.LowercaseStringTransformer.transform(params)).toBe('john.doe@example.com');
        });
        it('debe manejar string vacío', ()=>{
            const params = {
                value: ''
            };
            expect(_lowercasestringtransformer.LowercaseStringTransformer.transform(params)).toBe('');
        });
        it('debe retornar undefined si el valor es undefined', ()=>{
            const params = {
                value: undefined
            };
            expect(_lowercasestringtransformer.LowercaseStringTransformer.transform(params)).toBeUndefined();
        });
        it('debe retornar null si el valor es null', ()=>{
            const params = {
                value: null
            };
            expect(_lowercasestringtransformer.LowercaseStringTransformer.transform(params)).toBeNull();
        });
        it('debe retornar el mismo valor si no es string', ()=>{
            const paramsNumber = {
                value: 123
            };
            expect(_lowercasestringtransformer.LowercaseStringTransformer.transform(paramsNumber)).toBe(123);
            const paramsObject = {
                value: {
                    key: 'value'
                }
            };
            expect(_lowercasestringtransformer.LowercaseStringTransformer.transform(paramsObject)).toEqual({
                key: 'value'
            });
        });
        it('debe manejar string con caracteres especiales', ()=>{
            const params = {
                value: '  HÓLÁ MÚNDÒ  '
            };
            expect(_lowercasestringtransformer.LowercaseStringTransformer.transform(params)).toBe('hólá múndò');
        });
    });
});

//# sourceMappingURL=lowercase-string.transformer.spec.js.map
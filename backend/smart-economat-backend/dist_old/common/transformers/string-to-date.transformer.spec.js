"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _stringtodatetransformer = require("./string-to-date.transformer");
/**
 * Tests Unitarios de StringToDateTransformer
 */ describe('StringToDateTransformer', ()=>{
    describe('transform()', ()=>{
        it('debe convertir string ISO a Date', ()=>{
            const params = {
                value: '2024-01-15T10:30:00.000Z'
            };
            const result = _stringtodatetransformer.StringToDateTransformer.transform(params);
            expect(result).toBeInstanceOf(Date);
            expect(result?.toISOString()).toBe('2024-01-15T10:30:00.000Z');
        });
        it('debe convertir string de fecha a Date', ()=>{
            const params = {
                value: '2024-01-15'
            };
            const result = _stringtodatetransformer.StringToDateTransformer.transform(params);
            expect(result).toBeInstanceOf(Date);
        });
        it('debe manejar Date directo', ()=>{
            const date = new Date('2024-01-15T10:30:00.000Z');
            const params = {
                value: date
            };
            expect(_stringtodatetransformer.StringToDateTransformer.transform(params)).toBe(date);
        });
        it('debe convertir timestamp a Date', ()=>{
            const timestamp = 1705315800000;
            const params = {
                value: timestamp
            };
            const result = _stringtodatetransformer.StringToDateTransformer.transform(params);
            expect(result).toBeInstanceOf(Date);
            expect(result?.getTime()).toBe(timestamp);
        });
        it('debe retornar undefined si el valor es undefined', ()=>{
            const params = {
                value: undefined
            };
            expect(_stringtodatetransformer.StringToDateTransformer.transform(params)).toBeUndefined();
        });
        it('debe retornar undefined si el valor es null', ()=>{
            const params = {
                value: null
            };
            expect(_stringtodatetransformer.StringToDateTransformer.transform(params)).toBeNull();
        });
        it('debe retornar undefined si el string está vacío', ()=>{
            const params = {
                value: ''
            };
            expect(_stringtodatetransformer.StringToDateTransformer.transform(params)).toBeUndefined();
        });
        it('debe retornar undefined si el string solo tiene espacios', ()=>{
            const params = {
                value: '   '
            };
            expect(_stringtodatetransformer.StringToDateTransformer.transform(params)).toBeUndefined();
        });
        it('debe lanzar error si la fecha es inválida', ()=>{
            const params = {
                value: 'fecha-invalida'
            };
            expect(()=>_stringtodatetransformer.StringToDateTransformer.transform(params)).toThrow("El valor 'fecha-invalida' no puede ser convertido a fecha");
        });
        it('debe lanzar error si el timestamp es NaN', ()=>{
            const params = {
                value: NaN
            };
            expect(()=>_stringtodatetransformer.StringToDateTransformer.transform(params)).toThrow("El timestamp 'NaN' no es una fecha válida");
        });
        it('debe manejar string con trim', ()=>{
            const params = {
                value: '  2024-01-15T10:30:00.000Z  '
            };
            const result = _stringtodatetransformer.StringToDateTransformer.transform(params);
            expect(result).toBeInstanceOf(Date);
        });
        it('debe rechazar Date inválido', ()=>{
            const invalidDate = new Date('invalid');
            const params = {
                value: invalidDate
            };
            const result = _stringtodatetransformer.StringToDateTransformer.transform(params);
            expect(result).toBeUndefined();
        });
        it('debe manejar fecha con timezone', ()=>{
            const params = {
                value: '2024-01-15T10:30:00+05:00'
            };
            const result = _stringtodatetransformer.StringToDateTransformer.transform(params);
            expect(result).toBeInstanceOf(Date);
        });
        it('debe manejar fecha en formato MM/DD/YYYY', ()=>{
            const params = {
                value: '01/15/2024'
            };
            const result = _stringtodatetransformer.StringToDateTransformer.transform(params);
            expect(result).toBeInstanceOf(Date);
        });
    });
});

//# sourceMappingURL=string-to-date.transformer.spec.js.map
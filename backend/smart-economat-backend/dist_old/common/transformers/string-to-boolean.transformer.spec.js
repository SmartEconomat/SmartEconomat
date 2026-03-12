"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _stringtobooleantransformer = require("./string-to-boolean.transformer");
/**
 * Tests Unitarios de StringToBooleanTransformer
 */ describe('StringToBooleanTransformer', ()=>{
    describe('transform()', ()=>{
        it('debe convertir "true" a true', ()=>{
            const params = {
                value: 'true'
            };
            expect(_stringtobooleantransformer.StringToBooleanTransformer.transform(params)).toBe(true);
        });
        it('debe convertir "True" a true (case insensitive)', ()=>{
            const params = {
                value: 'True'
            };
            expect(_stringtobooleantransformer.StringToBooleanTransformer.transform(params)).toBe(true);
        });
        it('debe convertir "TRUE" a true (case insensitive)', ()=>{
            const params = {
                value: 'TRUE'
            };
            expect(_stringtobooleantransformer.StringToBooleanTransformer.transform(params)).toBe(true);
        });
        it('debe convertir "1" a true', ()=>{
            const params = {
                value: '1'
            };
            expect(_stringtobooleantransformer.StringToBooleanTransformer.transform(params)).toBe(true);
        });
        it('debe convertir "yes" a true', ()=>{
            const params = {
                value: 'yes'
            };
            expect(_stringtobooleantransformer.StringToBooleanTransformer.transform(params)).toBe(true);
        });
        it('debe convertir "sí" a true', ()=>{
            const params = {
                value: 'sí'
            };
            expect(_stringtobooleantransformer.StringToBooleanTransformer.transform(params)).toBe(true);
        });
        it('debe convertir "si" a true', ()=>{
            const params = {
                value: 'si'
            };
            expect(_stringtobooleantransformer.StringToBooleanTransformer.transform(params)).toBe(true);
        });
        it('debe convertir "false" a false', ()=>{
            const params = {
                value: 'false'
            };
            expect(_stringtobooleantransformer.StringToBooleanTransformer.transform(params)).toBe(false);
        });
        it('debe convertir "False" a false (case insensitive)', ()=>{
            const params = {
                value: 'False'
            };
            expect(_stringtobooleantransformer.StringToBooleanTransformer.transform(params)).toBe(false);
        });
        it('debe convertir "0" a false', ()=>{
            const params = {
                value: '0'
            };
            expect(_stringtobooleantransformer.StringToBooleanTransformer.transform(params)).toBe(false);
        });
        it('debe convertir "no" a false', ()=>{
            const params = {
                value: 'no'
            };
            expect(_stringtobooleantransformer.StringToBooleanTransformer.transform(params)).toBe(false);
        });
        it('debe manejar booleano directo true', ()=>{
            const params = {
                value: true
            };
            expect(_stringtobooleantransformer.StringToBooleanTransformer.transform(params)).toBe(true);
        });
        it('debe manejar booleano directo false', ()=>{
            const params = {
                value: false
            };
            expect(_stringtobooleantransformer.StringToBooleanTransformer.transform(params)).toBe(false);
        });
        it('debe convertir número 1 a true', ()=>{
            const params = {
                value: 1
            };
            expect(_stringtobooleantransformer.StringToBooleanTransformer.transform(params)).toBe(true);
        });
        it('debe convertir número 0 a false', ()=>{
            const params = {
                value: 0
            };
            expect(_stringtobooleantransformer.StringToBooleanTransformer.transform(params)).toBe(false);
        });
        it('debe convertir número diferente de 0 a true', ()=>{
            const params = {
                value: 5
            };
            expect(_stringtobooleantransformer.StringToBooleanTransformer.transform(params)).toBe(true);
        });
        it('debe retornar undefined si el valor es undefined', ()=>{
            const params = {
                value: undefined
            };
            expect(_stringtobooleantransformer.StringToBooleanTransformer.transform(params)).toBeUndefined();
        });
        it('debe retornar undefined si el valor es null', ()=>{
            const params = {
                value: null
            };
            expect(_stringtobooleantransformer.StringToBooleanTransformer.transform(params)).toBeNull();
        });
        it('debe retornar undefined si el string está vacío', ()=>{
            const params = {
                value: ''
            };
            expect(_stringtobooleantransformer.StringToBooleanTransformer.transform(params)).toBeUndefined();
        });
        it('debe retornar undefined si el string solo tiene espacios', ()=>{
            const params = {
                value: '   '
            };
            expect(_stringtobooleantransformer.StringToBooleanTransformer.transform(params)).toBeUndefined();
        });
        it('debe lanzar error si el string no es convertible', ()=>{
            const params = {
                value: 'abc'
            };
            expect(()=>_stringtobooleantransformer.StringToBooleanTransformer.transform(params)).toThrow("El valor 'abc' no puede ser convertido a booleano");
        });
        it('debe manejar string con trim', ()=>{
            const params = {
                value: '  true  '
            };
            expect(_stringtobooleantransformer.StringToBooleanTransformer.transform(params)).toBe(true);
        });
    });
});

//# sourceMappingURL=string-to-boolean.transformer.spec.js.map
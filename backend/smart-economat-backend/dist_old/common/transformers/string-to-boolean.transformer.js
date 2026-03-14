"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "StringToBooleanTransformer", {
    enumerable: true,
    get: function() {
        return StringToBooleanTransformer;
    }
});
let StringToBooleanTransformer = class StringToBooleanTransformer {
    static transform(params) {
        const value = params.value;
        if (value == null) return value;
        // Si ya es booleano, retornarlo
        if (typeof value === 'boolean') return value;
        // Si es número, convertir (1 = true, 0 = false)
        if (typeof value === 'number') return value !== 0;
        // Si es string, normalizar y convertir
        if (typeof value === 'string') {
            const trimmed = value.trim().toLowerCase();
            if (trimmed === '') return undefined;
            if ([
                'true',
                '1',
                'yes',
                'sí',
                'si'
            ].includes(trimmed)) return true;
            if ([
                'false',
                '0',
                'no'
            ].includes(trimmed)) return false;
            throw new Error(`El valor '${value}' no puede ser convertido a booleano`);
        }
        return Boolean(value);
    }
};

//# sourceMappingURL=string-to-boolean.transformer.js.map
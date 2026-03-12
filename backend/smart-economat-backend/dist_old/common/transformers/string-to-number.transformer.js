"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "StringToNumberTransformer", {
    enumerable: true,
    get: function() {
        return StringToNumberTransformer;
    }
});
let StringToNumberTransformer = class StringToNumberTransformer {
    static transform(params) {
        const value = params.value;
        if (value == null) return value;
        // Si ya es número, retornarlo
        if (typeof value === 'number') return value;
        // Si es string, intentar convertir
        if (typeof value === 'string') {
            const trimmed = value.trim();
            if (trimmed === '') return undefined;
            const num = Number(trimmed);
            if (isNaN(num)) {
                throw new Error(`El valor '${value}' no puede ser convertido a número`);
            }
            return num;
        }
        return value;
    }
};

//# sourceMappingURL=string-to-number.transformer.js.map
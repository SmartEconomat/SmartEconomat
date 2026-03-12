"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "NormalizeArrayTransformer", {
    enumerable: true,
    get: function() {
        return NormalizeArrayTransformer;
    }
});
let NormalizeArrayTransformer = class NormalizeArrayTransformer {
    static transform(params) {
        const value = params.value;
        if (value == null) return value;
        // Si ya es array, procesar elementos
        if (Array.isArray(value)) {
            return value.filter((item)=>item != null).map((item)=>typeof item === 'string' ? item.trim() : item);
        }
        // Si es string, intentar dividir por comas
        if (typeof value === 'string') {
            const trimmed = value.trim();
            if (trimmed === '') return undefined;
            return trimmed.split(',').map((item)=>item.trim()).filter((item)=>item !== '');
        }
        // Si es un solo elemento, convertirlo a array
        return [
            value
        ];
    }
};

//# sourceMappingURL=normalize-array.transformer.js.map
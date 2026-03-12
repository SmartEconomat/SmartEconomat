"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "TrimStringTransformer", {
    enumerable: true,
    get: function() {
        return TrimStringTransformer;
    }
});
let TrimStringTransformer = class TrimStringTransformer {
    static transform(params) {
        const value = params.value;
        if (value == null) return value;
        if (typeof value !== 'string') return value;
        return value.trim();
    }
};

//# sourceMappingURL=trim-string.transformer.js.map
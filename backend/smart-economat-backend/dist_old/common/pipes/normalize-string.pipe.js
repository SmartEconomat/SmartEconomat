"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "NormalizeStringPipe", {
    enumerable: true,
    get: function() {
        return NormalizeStringPipe;
    }
});
let NormalizeStringPipe = class NormalizeStringPipe {
    static transform(options = {}) {
        return (params)=>{
            const { trim = true, uppercase = false, lowercase = false } = options;
            let value = params.value;
            if (value == null) return value;
            if (typeof value !== 'string') return value;
            if (trim) {
                value = value.trim();
            }
            if (uppercase && lowercase) {
                throw new Error('No se pueden activar uppercase y lowercase al mismo tiempo');
            }
            if (uppercase) {
                value = value.toUpperCase();
            }
            if (lowercase) {
                value = value.toLowerCase();
            }
            return value;
        };
    }
};

//# sourceMappingURL=normalize-string.pipe.js.map
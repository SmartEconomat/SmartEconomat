'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'LowercaseStringTransformer', {
  enumerable: true,
  get: function () {
    return LowercaseStringTransformer;
  },
});
let LowercaseStringTransformer = class LowercaseStringTransformer {
  static transform(params) {
    const value = params.value;
    if (value == null) return value;
    if (typeof value !== 'string') return value;
    return value.trim().toLowerCase();
  }
};

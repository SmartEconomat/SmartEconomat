'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'UppercaseStringTransformer', {
  enumerable: true,
  get: function () {
    return UppercaseStringTransformer;
  },
});
let UppercaseStringTransformer = class UppercaseStringTransformer {
  static transform(params) {
    const value = params.value;
    if (value == null) return value;
    if (typeof value !== 'string') return value;
    return value.trim().toUpperCase();
  }
};

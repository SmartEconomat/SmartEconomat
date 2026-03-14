'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'NormalizeArrayTransformer', {
  enumerable: true,
  get: function () {
    return NormalizeArrayTransformer;
  },
});
let NormalizeArrayTransformer = class NormalizeArrayTransformer {
  static transform(params) {
    const value = params.value;
    if (value == null) return value;

    if (Array.isArray(value)) {
      return value
        .filter((item) => item != null)
        .map((item) => (typeof item === 'string' ? item.trim() : item));
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed === '') return undefined;
      return trimmed
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item !== '');
    }

    return [value];
  }
};

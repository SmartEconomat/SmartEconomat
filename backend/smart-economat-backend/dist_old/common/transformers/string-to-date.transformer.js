'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'StringToDateTransformer', {
  enumerable: true,
  get: function () {
    return StringToDateTransformer;
  },
});
let StringToDateTransformer = class StringToDateTransformer {
  static transform(params) {
    const value = params.value;
    if (value == null) return value;

    if (value instanceof Date) {
      return isNaN(value.getTime()) ? undefined : value;
    }

    if (typeof value === 'number') {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error(`El timestamp '${value}' no es una fecha válida`);
      }
      return date;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed === '') return undefined;
      const date = new Date(trimmed);
      if (isNaN(date.getTime())) {
        throw new Error(`El valor '${value}' no puede ser convertido a fecha`);
      }
      return date;
    }
    return value;
  }
};

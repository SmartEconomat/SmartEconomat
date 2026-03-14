'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'ColumnNumericTransformer', {
  enumerable: true,
  get: function () {
    return ColumnNumericTransformer;
  },
});
let ColumnNumericTransformer = class ColumnNumericTransformer {
  to(data) {
    return data;
  }
  from(data) {
    return parseFloat(data);
  }
};

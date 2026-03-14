'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'UpdateHistorialPrecioDto', {
  enumerable: true,
  get: function () {
    return UpdateHistorialPrecioDto;
  },
});
const _mappedtypes = require('@nestjs/mapped-types');
const _createhistorialpreciodto = require('./create-historial-precio.dto');
let UpdateHistorialPrecioDto = class UpdateHistorialPrecioDto extends (0,
_mappedtypes.PartialType)(
  _createhistorialpreciodto.CreateHistorialPrecioDto
) {};

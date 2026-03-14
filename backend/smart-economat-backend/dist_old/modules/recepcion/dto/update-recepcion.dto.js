'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'UpdateRecepcionDto', {
  enumerable: true,
  get: function () {
    return UpdateRecepcionDto;
  },
});
const _mappedtypes = require('@nestjs/mapped-types');
const _createrecepciondto = require('./create-recepcion.dto');
let UpdateRecepcionDto = class UpdateRecepcionDto extends (0,
_mappedtypes.PartialType)(_createrecepciondto.CreateRecepcionDto) {};

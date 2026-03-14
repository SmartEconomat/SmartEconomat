'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'UpdatePedidoDto', {
  enumerable: true,
  get: function () {
    return UpdatePedidoDto;
  },
});
const _mappedtypes = require('@nestjs/mapped-types');
const _createpedidodto = require('./create-pedido.dto');
let UpdatePedidoDto = class UpdatePedidoDto extends (0,
_mappedtypes.PartialType)(_createpedidodto.CreatePedidoDto) {};

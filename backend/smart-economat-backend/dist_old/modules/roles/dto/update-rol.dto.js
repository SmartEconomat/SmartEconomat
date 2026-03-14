'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'UpdateRolDto', {
  enumerable: true,
  get: function () {
    return UpdateRolDto;
  },
});
const _swagger = require('@nestjs/swagger');
const _createroldto = require('./create-rol.dto');
let UpdateRolDto = class UpdateRolDto extends (0, _swagger.PartialType)(
  _createroldto.CreateRolDto
) {};

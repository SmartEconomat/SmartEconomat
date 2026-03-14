'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'UpdateUsuarioRolDto', {
  enumerable: true,
  get: function () {
    return UpdateUsuarioRolDto;
  },
});
const _nestjsi18n = require('nestjs-i18n');
const _classvalidator = require('class-validator');
const _usuarioenums = require('../enums/usuario.enums');
function _ts_decorate(decorators, target, key, desc) {
  var c = arguments.length,
    r =
      c < 3
        ? target
        : desc === null
          ? (desc = Object.getOwnPropertyDescriptor(target, key))
          : desc,
    d;
  if (typeof Reflect === 'object' && typeof Reflect.decorate === 'function')
    r = Reflect.decorate(decorators, target, key, desc);
  else
    for (var i = decorators.length - 1; i >= 0; i--)
      if ((d = decorators[i]))
        r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return (c > 3 && r && Object.defineProperty(target, key, r), r);
}
function _ts_metadata(k, v) {
  if (typeof Reflect === 'object' && typeof Reflect.metadata === 'function')
    return Reflect.metadata(k, v);
}
let UpdateUsuarioRolDto = class UpdateUsuarioRolDto {};
_ts_decorate(
  [
    (0, _classvalidator.IsEnum)(_usuarioenums.rolUsuario, {
      message: (0, _nestjsi18n.i18nValidationMessage)(
        'validation.EL_ROL_DE_USUARIO_NO_ES_V_LIDO'
      ),
    }),
    _ts_metadata(
      'design:type',
      typeof _usuarioenums.rolUsuario === 'undefined'
        ? Object
        : _usuarioenums.rolUsuario
    ),
  ],
  UpdateUsuarioRolDto.prototype,
  'rol',
  void 0
);

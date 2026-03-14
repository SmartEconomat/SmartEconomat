'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'ParseUUIDv7Pipe', {
  enumerable: true,
  get: function () {
    return ParseUUIDv7Pipe;
  },
});
const _i18nhelper = require('../helpers/i18n.helper');
const _common = require('@nestjs/common');
const _classvalidator = require('class-validator');
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
let ParseUUIDv7Pipe = class ParseUUIDv7Pipe {
  /**
   * Transforma y valida el valor del parámetro
   *
   * @param value - El valor del parámetro a validar
   * @param _metadata - Metadatos del argumento (no usado)
   * @returns El valor validado
   * @throws BadRequestException si el valor no es un UUID v7 válido
   */ transform(value) {
    if (!value) {
      throw new _common.BadRequestException(
        _i18nhelper.I18nHelper.getError('EL_UUID_NO_PUEDE_ESTAR_VAC_O')
      );
    }
    if (!(0, _classvalidator.isUUID)(value, '7')) {
      throw new _common.BadRequestException(
        `El valor '${value}' no es un UUID v7 válido`
      );
    }
    if (!ParseUUIDv7Pipe.UUID_V7_REGEX.test(value)) {
      throw new _common.BadRequestException(
        `El valor '${value}' no tiene el formato correcto de UUID v7`
      );
    }
    return value;
  }
};
/**
 * Expresión regular para validar UUID v7
 *
 * Desglose del patrón:
 * - ^[0-9a-f]{8}: Primer grupo - 8 hex digits
 * - - : Guion separador
 * - [0-9a-f]{4}: Segundo grupo - 4 hex digits
 * - - : Guion separador
 * - 7[0-9a-f]{3}: Tercer grupo - comienza con '7' (versión) + 3 hex digits
 * - - : Guion separador
 * - [89ab][0-9a-f]{3}: Cuarto grupo - variante (8,9,a,b) + 3 hex digits
 * - - : Guion separador
 * - [0-9a-f]{12}$: Quinto grupo - 12 hex digits
 */ ParseUUIDv7Pipe.UUID_V7_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
ParseUUIDv7Pipe = _ts_decorate([(0, _common.Injectable)()], ParseUUIDv7Pipe);

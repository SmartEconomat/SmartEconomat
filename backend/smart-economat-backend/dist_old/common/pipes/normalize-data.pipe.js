'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'NormalizeDataPipe', {
  enumerable: true,
  get: function () {
    return NormalizeDataPipe;
  },
});
const _common = require('@nestjs/common');
const _classtransformer = require('class-transformer');
const _classvalidator = require('class-validator');
const _i18nhelper = require('../helpers/i18n.helper');
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
let NormalizeDataPipe = class NormalizeDataPipe {
  async transform(value, metadata) {
    if (!value || typeof value !== 'object') {
      return value;
    }

    if (metadata.metatype) {
      const transformed = (0, _classtransformer.plainToInstance)(
        metadata.metatype,
        value,
        {
          enableImplicitConversion: true,
          excludeExtraneousValues: true,
        }
      );

      const errors = await (0, _classvalidator.validate)(transformed);
      if (errors.length > 0) {
        const errorMessages = errors
          .flatMap((error) => Object.values(error.constraints || {}))
          .join(', ');
        throw new _common.BadRequestException(
          _i18nhelper.I18nHelper.getError('VALIDACION_FALLIDA') +
            `: ${errorMessages}`
        );
      }
      return transformed;
    }

    return this.normalizeObject(value);
  }
  /**
   * Normaliza un objeto recursivamente
   */ normalizeObject(obj) {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }
    if (Array.isArray(obj)) {
      return obj.map((item) => this.normalizeObject(item));
    }
    const normalized = {};
    for (const [key, value] of Object.entries(obj)) {
      const normalizedKey = typeof key === 'string' ? key.trim() : key;

      if (typeof value === 'string') {
        normalized[normalizedKey] = value.trim();
      } else if (value != null && typeof value === 'object') {
        normalized[normalizedKey] = this.normalizeObject(value);
      } else {
        normalized[normalizedKey] = value;
      }
    }
    return normalized;
  }
};
NormalizeDataPipe = _ts_decorate(
  [(0, _common.Injectable)()],
  NormalizeDataPipe
);

'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'FileResponseDto', {
  enumerable: true,
  get: function () {
    return FileResponseDto;
  },
});
const _swagger = require('@nestjs/swagger');
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
let FileResponseDto = class FileResponseDto {};
_ts_decorate(
  [
    (0, _swagger.ApiProperty)({
      description: 'docs.ID_NICO_DEL_ARCHIVO',
      format: 'uuid',
    }),
    _ts_metadata('design:type', String),
  ],
  FileResponseDto.prototype,
  'id',
  void 0
);
_ts_decorate(
  [
    (0, _swagger.ApiProperty)({
      description: 'docs.NOMBRE_ORIGINAL_DEL_ARCHIVO',
    }),
    _ts_metadata('design:type', String),
  ],
  FileResponseDto.prototype,
  'nombre',
  void 0
);
_ts_decorate(
  [
    (0, _swagger.ApiProperty)({
      description: 'docs.URL_PARA_ACCEDER_AL_ARCHIVO',
    }),
    _ts_metadata('design:type', String),
  ],
  FileResponseDto.prototype,
  'url',
  void 0
);
_ts_decorate(
  [
    (0, _swagger.ApiProperty)({
      description: 'docs.TAMA_O_DEL_ARCHIVO_EN_BYTES',
    }),
    _ts_metadata('design:type', Number),
  ],
  FileResponseDto.prototype,
  'tamano',
  void 0
);
_ts_decorate(
  [
    (0, _swagger.ApiProperty)({
      description: 'docs.TIPO_MIME_DEL_ARCHIVO',
    }),
    _ts_metadata('design:type', String),
  ],
  FileResponseDto.prototype,
  'mimeType',
  void 0
);
_ts_decorate(
  [
    (0, _swagger.ApiProperty)({
      description: 'docs.FECHA_DE_SUBIDA_DEL_ARCHIVO',
    }),
    _ts_metadata('design:type', typeof Date === 'undefined' ? Object : Date),
  ],
  FileResponseDto.prototype,
  'fechaSubida',
  void 0
);
_ts_decorate(
  [
    (0, _swagger.ApiProperty)({
      description: 'docs.INFORMACI_N_B_SICA_DEL_USUARIO_QUE_SUBI',
      required: false,
    }),
    _ts_metadata('design:type', Object),
  ],
  FileResponseDto.prototype,
  'subidoPor',
  void 0
);

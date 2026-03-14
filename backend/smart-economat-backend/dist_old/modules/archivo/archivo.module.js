'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'ArchivoModule', {
  enumerable: true,
  get: function () {
    return ArchivoModule;
  },
});
const _common = require('@nestjs/common');
const _typeorm = require('@nestjs/typeorm');
const _config = require('@nestjs/config');
const _platformexpress = require('@nestjs/platform-express');
const _multer = require('multer');
const _path = require('path');
const _archivocontroller = require('./controller/archivo.controller');
const _archivoservice = require('./service/archivo.service');
const _archivoentity = require('./archivo.entity/archivo.entity');
const _crypto = require('crypto');
const _fs = /*#__PURE__*/ _interop_require_wildcard(require('fs'));
const _i18nhelper = require('../../common/helpers/i18n.helper');
function _getRequireWildcardCache(nodeInterop) {
  if (typeof WeakMap !== 'function') return null;
  var cacheBabelInterop = new WeakMap();
  var cacheNodeInterop = new WeakMap();
  return (_getRequireWildcardCache = function (nodeInterop) {
    return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
  })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
  if (!nodeInterop && obj && obj.__esModule) {
    return obj;
  }
  if (obj === null || (typeof obj !== 'object' && typeof obj !== 'function')) {
    return {
      default: obj,
    };
  }
  var cache = _getRequireWildcardCache(nodeInterop);
  if (cache && cache.has(obj)) {
    return cache.get(obj);
  }
  var newObj = {
    __proto__: null,
  };
  var hasPropertyDescriptor =
    Object.defineProperty && Object.getOwnPropertyDescriptor;
  for (var key in obj) {
    if (key !== 'default' && Object.prototype.hasOwnProperty.call(obj, key)) {
      var desc = hasPropertyDescriptor
        ? Object.getOwnPropertyDescriptor(obj, key)
        : null;
      if (desc && (desc.get || desc.set)) {
        Object.defineProperty(newObj, key, desc);
      } else {
        newObj[key] = obj[key];
      }
    }
  }
  newObj.default = obj;
  if (cache) {
    cache.set(obj, newObj);
  }
  return newObj;
}
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
let ArchivoModule = class ArchivoModule {};
ArchivoModule = _ts_decorate(
  [
    (0, _common.Module)({
      imports: [
        _typeorm.TypeOrmModule.forFeature([_archivoentity.Archivo]),
        _platformexpress.MulterModule.registerAsync({
          imports: [_config.ConfigModule],
          inject: [_config.ConfigService],
          useFactory: (configService) => {
            const uploadDir = configService.get(
              'LOCAL_STORAGE_PATH',
              './uploads'
            );
            if (!_fs.existsSync(uploadDir)) {
              _fs.mkdirSync(uploadDir, {
                recursive: true,
              });
            }
            return {
              storage: (0, _multer.diskStorage)({
                destination: uploadDir,
                filename: (req, file, cb) => {
                  const uniqueFileName = `${(0, _crypto.randomUUID)()}${(0, _path.extname)(file.originalname)}`;
                  cb(null, uniqueFileName);
                },
              }),
              limits: {
                fileSize:
                  configService.get('MAX_FILE_SIZE_MB', 10) * 1024 * 1024,
              },
              fileFilter: (req, file, cb) => {
                if (file.mimetype.match(/\/(jpg|jpeg|png|gif|pdf)$/)) {
                  cb(null, true);
                } else {
                  cb(
                    new _common.BadRequestException(
                      _i18nhelper.I18nHelper.getError(
                        'TIPO_DE_ARCHIVO_NO_SOPORTADO'
                      )
                    ),
                    false
                  );
                }
              },
            };
          },
        }),
      ],
      controllers: [_archivocontroller.ArchivoController],
      providers: [_archivoservice.ArchivoService],
      exports: [_archivoservice.ArchivoService],
    }),
  ],
  ArchivoModule
);

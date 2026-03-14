'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'ArchivoController', {
  enumerable: true,
  get: function () {
    return ArchivoController;
  },
});
const _common = require('@nestjs/common');
const _platformexpress = require('@nestjs/platform-express');
const _swagger = require('@nestjs/swagger');
const _fileresponsedto = require('../dto/file-response.dto');
const _archivoservice = require('../service/archivo.service');
const _filelistfilterdto = require('../dto/file-list-filter.dto');
const _jwtauthguard = require('../../auth/guards/jwt-auth.guard');
const _i18nhelper = require('../../../common/helpers/i18n.helper');
const _requirepermissionsdecorator = require('../../../common/decorators/require-permissions.decorator');
const _permisosguard = require('../../authorization/guards/permisos.guard');
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
function _ts_param(paramIndex, decorator) {
  return function (target, key) {
    decorator(target, key, paramIndex);
  };
}
let ArchivoController = class ArchivoController {
  async uploadFile(file, req) {
    const user = req.user;
    const result = await this.archivoService.uploadFile(file, user);
    return {
      message: _i18nhelper.I18nHelper.getSuccess('FILE_UPLOADED'),
      data: this.mapToResponseDto(result),
    };
  }
  async findAll(filterDto) {
    const result = await this.archivoService.findAll(filterDto);
    return {
      data: result.data.map((a) => this.mapToResponseDto(a)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }
  async findOne(id) {
    const result = await this.archivoService.findOne(id);
    return this.mapToResponseDto(result);
  }
  getFileContent(filename, res) {
    const filePath = this.archivoService.getFileContent(filename);
    res.sendFile(filePath);
  }
  async remove(id, req, res) {
    const user = req.user;
    await this.archivoService.remove(id, user);
    res.status(_common.HttpStatus.NO_CONTENT).send();
  }
  mapToResponseDto(archivo) {
    const dto = new _fileresponsedto.FileResponseDto();
    dto.id = archivo.id;
    dto.nombre = archivo.nombre;
    dto.url = archivo.url;
    dto.tamano = archivo.tamano;
    dto.mimeType = archivo.mimeType;
    dto.fechaSubida = archivo.createdAt;
    if (archivo.usuario) {
      dto.subidoPor = {
        id: archivo.usuario.id,
        nombre: archivo.usuario.nombre,
        username: archivo.usuario.username,
      };
    }
    return dto;
  }
  constructor(archivoService) {
    this.archivoService = archivoService;
  }
};
_ts_decorate(
  [
    (0, _common.Post)('upload'),
    (0, _requirepermissionsdecorator.RequirePermissions)('archivos:subir'),
    (0, _swagger.ApiOperation)({
      summary: 'Subir un nuevo archivo',
    }),
    (0, _swagger.ApiConsumes)('multipart/form-data'),
    (0, _swagger.ApiBody)({
      schema: {
        type: 'object',
        properties: {
          file: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    }),
    (0, _swagger.ApiResponse)({
      status: 201,
      description: 'docs.ARCHIVO_SUBIDO_CORRECTAMENTE',
    }),
    (0, _common.UseInterceptors)((0, _platformexpress.FileInterceptor)('file')),
    _ts_param(0, (0, _common.UploadedFile)()),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [
      typeof Express === 'undefined' ||
      typeof Express.Multer === 'undefined' ||
      typeof Express.Multer.File === 'undefined'
        ? Object
        : Express.Multer.File,
      Object,
    ]),
    _ts_metadata('design:returntype', Promise),
  ],
  ArchivoController.prototype,
  'uploadFile',
  null
);
_ts_decorate(
  [
    (0, _common.Get)(),
    (0, _requirepermissionsdecorator.RequirePermissions)('archivos:listar'),
    (0, _swagger.ApiOperation)({
      summary: 'Listar archivos',
    }),
    (0, _swagger.ApiResponse)({
      status: 200,
      description: 'docs.LISTA_DE_ARCHIVOS_PAGINADA',
    }),
    _ts_param(0, (0, _common.Query)()),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [
      typeof _filelistfilterdto.FileListFilterDto === 'undefined'
        ? Object
        : _filelistfilterdto.FileListFilterDto,
    ]),
    _ts_metadata('design:returntype', Promise),
  ],
  ArchivoController.prototype,
  'findAll',
  null
);
_ts_decorate(
  [
    (0, _common.Get)(':id'),
    (0, _requirepermissionsdecorator.RequirePermissions)('archivos:ver'),
    (0, _swagger.ApiOperation)({
      summary: 'Obtener metadata de un archivo por ID',
    }),
    (0, _swagger.ApiResponse)({
      status: 200,
      description: 'docs.DETALLES_DEL_ARCHIVO',
    }),
    _ts_param(0, (0, _common.Param)('id', _common.ParseUUIDPipe)),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [String]),
    _ts_metadata('design:returntype', Promise),
  ],
  ArchivoController.prototype,
  'findOne',
  null
);
_ts_decorate(
  [
    (0, _common.Get)('content/:filename'),
    (0, _requirepermissionsdecorator.RequirePermissions)('archivos:ver'),
    (0, _swagger.ApiOperation)({
      summary: 'Servir el contenido de un archivo subido',
    }),
    _ts_param(0, (0, _common.Param)('filename')),
    _ts_param(1, (0, _common.Res)()),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [
      String,
      typeof Response === 'undefined' ? Object : Response,
    ]),
    _ts_metadata('design:returntype', void 0),
  ],
  ArchivoController.prototype,
  'getFileContent',
  null
);
_ts_decorate(
  [
    (0, _common.Delete)(':id'),
    (0, _requirepermissionsdecorator.RequirePermissions)('archivos:eliminar'),
    (0, _swagger.ApiOperation)({
      summary: 'Eliminar un archivo (soft-delete)',
    }),
    (0, _swagger.ApiResponse)({
      status: 204,
      description: 'docs.ARCHIVO_ELIMINADO_CORRECTAMENTE',
    }),
    _ts_param(0, (0, _common.Param)('id', _common.ParseUUIDPipe)),
    _ts_param(1, (0, _common.Req)()),
    _ts_param(2, (0, _common.Res)()),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [
      String,
      Object,
      typeof Response === 'undefined' ? Object : Response,
    ]),
    _ts_metadata('design:returntype', Promise),
  ],
  ArchivoController.prototype,
  'remove',
  null
);
ArchivoController = _ts_decorate(
  [
    (0, _swagger.ApiTags)('Archivos'),
    (0, _swagger.ApiBearerAuth)(),
    (0, _common.UseGuards)(
      _jwtauthguard.JwtAuthGuard,
      _permisosguard.PermisosGuard
    ),
    (0, _common.Controller)('archivos'),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [
      typeof _archivoservice.ArchivoService === 'undefined'
        ? Object
        : _archivoservice.ArchivoService,
    ]),
  ],
  ArchivoController
);

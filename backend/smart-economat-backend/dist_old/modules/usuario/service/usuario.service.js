'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'UsuarioService', {
  enumerable: true,
  get: function () {
    return UsuarioService;
  },
});
const _common = require('@nestjs/common');
const _usuariorepository = require('../repository/usuario.repository');
const _i18nhelper = require('../../../common/helpers/i18n.helper');
const _bcrypt = /*#__PURE__*/ _interop_require_wildcard(require('bcrypt'));
const _usuarioenums = require('../enums/usuario.enums');
const _typeorm = require('@nestjs/typeorm');
const _permisoentity = require('../../permisos/entities/permiso.entity');
const _typeorm1 = require('typeorm');
const _authorizationservice = require('../../authorization/services/authorization.service');
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
function _ts_metadata(k, v) {
  if (typeof Reflect === 'object' && typeof Reflect.metadata === 'function')
    return Reflect.metadata(k, v);
}
function _ts_param(paramIndex, decorator) {
  return function (target, key) {
    decorator(target, key, paramIndex);
  };
}
let UsuarioService = class UsuarioService {
  create(dto) {
    return this.usuarioRepo.createUsuario(dto);
  }
  findAll(query) {
    return this.usuarioRepo.findAll(query);
  }
  async findOne(id) {
    const usuario = await this.usuarioRepo.findById(id);
    if (!usuario) {
      throw new _common.NotFoundException(
        _i18nhelper.I18nHelper.getError('USER_NOT_FOUND')
      );
    }
    return usuario;
  }
  update(id, dto) {
    return this.usuarioRepo.updateUsuario(id, dto);
  }
  async changePassword(userId, dto) {
    const usuario = await this.usuarioRepo.findByIdWithPassword(userId);
    if (!usuario) throw new _common.NotFoundException();
    const isMatch = await _bcrypt.compare(dto.oldPassword, usuario.password);
    if (!isMatch) {
      throw new _common.UnauthorizedException(
        _i18nhelper.I18nHelper.getError('INVALID_OLD_PASSWORD')
      );
    }
    return this.usuarioRepo.updateUsuario(userId, {
      password: dto.newPassword,
    });
  }
  async resetPassword(id, dto) {
    const usuario = await this.findOne(id);
    if (usuario.status === _usuarioenums.UserStatus.BLOCKED) {
      throw new _common.BadRequestException(
        _i18nhelper.I18nHelper.getError('USER_BLOCKED_CANNOT_RESET_PASSWORD')
      );
    }
    return this.usuarioRepo.updateUsuario(id, {
      password: dto.password,
      mustChangePassword: true,
    });
  }
  remove(id) {
    return this.usuarioRepo.deleteUsuario(id);
  }
  async addAdditionalPermission(userId, permisoId) {
    const usuario = await this.usuarioRepo.findById(userId);
    if (!usuario) throw new _common.NotFoundException();
    const permiso = await this.permisoRepo.findOneBy({
      id: permisoId,
    });
    if (!permiso)
      throw new _common.NotFoundException(
        _i18nhelper.I18nHelper.getError('PERMISO_NO_ENCONTRADO')
      );
    const basicUser = await this.usuarioRepo.repo.findOne({
      where: {
        id: userId,
      },
      relations: ['permisosAdicionales'],
    });
    if (!basicUser.permisosAdicionales.find((p) => p.id === permisoId)) {
      basicUser.permisosAdicionales.push(permiso);
      await this.usuarioRepo.repo.save(basicUser);
      await this.authorizationService.invalidateUserCache(userId);
    }
    return this.findOne(userId);
  }
  async removeAdditionalPermission(userId, permisoId) {
    const basicUser = await this.usuarioRepo.repo.findOne({
      where: {
        id: userId,
      },
      relations: ['permisosAdicionales'],
    });
    if (!basicUser) throw new _common.NotFoundException();
    basicUser.permisosAdicionales = basicUser.permisosAdicionales.filter(
      (p) => p.id !== permisoId
    );
    await this.usuarioRepo.repo.save(basicUser);
    await this.authorizationService.invalidateUserCache(userId);
    return this.findOne(userId);
  }
  async addExcludedPermission(userId, permisoId) {
    const usuario = await this.usuarioRepo.findById(userId);
    if (!usuario) throw new _common.NotFoundException();
    const permiso = await this.permisoRepo.findOneBy({
      id: permisoId,
    });
    if (!permiso)
      throw new _common.NotFoundException(
        _i18nhelper.I18nHelper.getError('PERMISO_NO_ENCONTRADO')
      );
    const basicUser = await this.usuarioRepo.repo.findOne({
      where: {
        id: userId,
      },
      relations: ['permisosExcluidos'],
    });
    if (!basicUser.permisosExcluidos.find((p) => p.id === permisoId)) {
      basicUser.permisosExcluidos.push(permiso);
      await this.usuarioRepo.repo.save(basicUser);
      await this.authorizationService.invalidateUserCache(userId);
    }
    return this.findOne(userId);
  }
  async removeExcludedPermission(userId, permisoId) {
    const basicUser = await this.usuarioRepo.repo.findOne({
      where: {
        id: userId,
      },
      relations: ['permisosExcluidos'],
    });
    if (!basicUser) throw new _common.NotFoundException();
    basicUser.permisosExcluidos = (basicUser.permisosExcluidos || []).filter(
      (p) => p.id !== permisoId
    );
    await this.usuarioRepo.repo.save(basicUser);
    await this.authorizationService.invalidateUserCache(userId);
    return {
      success: true,
    };
  }
  constructor(usuarioRepo, permisoRepo, authorizationService) {
    this.usuarioRepo = usuarioRepo;
    this.permisoRepo = permisoRepo;
    this.authorizationService = authorizationService;
  }
};
UsuarioService = _ts_decorate(
  [
    (0, _common.Injectable)(),
    _ts_param(1, (0, _typeorm.InjectRepository)(_permisoentity.Permiso)),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [
      typeof _usuariorepository.UsuarioRepository === 'undefined'
        ? Object
        : _usuariorepository.UsuarioRepository,
      typeof _typeorm1.Repository === 'undefined'
        ? Object
        : _typeorm1.Repository,
      typeof _authorizationservice.AuthorizationService === 'undefined'
        ? Object
        : _authorizationservice.AuthorizationService,
    ]),
  ],
  UsuarioService
);

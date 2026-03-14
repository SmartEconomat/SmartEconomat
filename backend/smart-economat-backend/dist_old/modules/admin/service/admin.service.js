'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'AdminService', {
  enumerable: true,
  get: function () {
    return AdminService;
  },
});
const _i18nhelper = require('../../../common/helpers/i18n.helper');
const _common = require('@nestjs/common');
const _typeorm = require('@nestjs/typeorm');
const _typeorm1 = require('typeorm');
const _bcrypt = /*#__PURE__*/ _interop_require_wildcard(require('bcrypt'));
const _nodecrypto = require('node:crypto');
const _usuarioentity = require('../../usuario/usuario.entity/usuario.entity');
const _profesorentity = require('../../profesor/profesor.entity/profesor.entity');
const _usuarioenums = require('../../usuario/enums/usuario.enums');
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
let AdminService = class AdminService {
  async createProfesor(dto) {
    return this.dataSource.transaction(async (manager) => {
      const whereConditions = [
        {
          username: dto.username,
        },
      ];
      if (dto.email) {
        whereConditions.push({
          email: dto.email,
        });
      }
      const isExisting = await manager.findOne(_usuarioentity.Usuario, {
        where: whereConditions,
      });
      if (isExisting)
        throw new _common.ConflictException(
          _i18nhelper.I18nHelper.getError('USER_OR_EMAIL_ALREADY_EXISTS')
        );
      const isCialExisting = await manager.findOne(_profesorentity.Profesor, {
        where: {
          cial: dto.cial,
        },
      });
      if (isCialExisting)
        throw new _common.ConflictException(
          _i18nhelper.I18nHelper.getError('CIAL_ALREADY_EXISTS')
        );
      const passwordHash = await _bcrypt.hash(dto.password, 10);
      const user = manager.create(_usuarioentity.Usuario, {
        username: dto.username,
        email: dto.email,
        password: passwordHash,
        rol: _usuarioenums.rolUsuario.PROFESOR,
        status: _usuarioenums.UserStatus.INACTIVE,
      });
      await manager.save(user);
      const profesor = manager.create(_profesorentity.Profesor, {
        userId: user.id,
        cial: dto.cial,
      });
      await manager.save(profesor);
      return {
        id: profesor.id,
        user_id: user.id,
        username: user.username,
        cial: profesor.cial,
        status: user.status,
      };
    });
  }
  async activateUser(userId) {
    const user = await this.usuarioRepo.findOne({
      where: {
        id: userId,
      },
    });
    if (!user)
      throw new _common.NotFoundException(
        _i18nhelper.I18nHelper.getError('USER_NOT_FOUND_1')
      );
    if (user.status === _usuarioenums.UserStatus.ACTIVE) {
      throw new _common.BadRequestException(
        _i18nhelper.I18nHelper.getError('USER_IS_ALREADY_ACTIVE')
      );
    }
    user.status = _usuarioenums.UserStatus.ACTIVE;
    await this.usuarioRepo.save(user);
    return {
      message: _i18nhelper.I18nHelper.translate(
        'messages.USER_ACTIVATED_SUCCESSFULLY'
      ),
      id: user.id,
      status: user.status,
    };
  }
  async forcePasswordReset(userId) {
    const user = await this.usuarioRepo.findOne({
      where: {
        id: userId,
      },
    });
    if (!user)
      throw new _common.NotFoundException(
        _i18nhelper.I18nHelper.getError('USER_NOT_FOUND')
      );
    const chars =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let provisionalPassword = '';
    const bytes = (0, _nodecrypto.randomBytes)(8);
    for (let i = 0; i < 8; i++) {
      provisionalPassword += chars[bytes[i] % chars.length];
    }
    user.password = provisionalPassword;
    user.mustChangePassword = true;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await this.usuarioRepo.save(user);
    return {
      message: _i18nhelper.I18nHelper.translate(
        'messages.CONTRASE_A_RESTABLECIDA_EXITOSAMENTE_ENT'
      ),
      provisionalPassword,
      mustChangePassword: true,
    };
  }
  constructor(usuarioRepo, profesorRepo, dataSource) {
    this.usuarioRepo = usuarioRepo;
    this.profesorRepo = profesorRepo;
    this.dataSource = dataSource;
  }
};
AdminService = _ts_decorate(
  [
    (0, _common.Injectable)(),
    _ts_param(0, (0, _typeorm.InjectRepository)(_usuarioentity.Usuario)),
    _ts_param(1, (0, _typeorm.InjectRepository)(_profesorentity.Profesor)),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [
      typeof _typeorm1.Repository === 'undefined'
        ? Object
        : _typeorm1.Repository,
      typeof _typeorm1.Repository === 'undefined'
        ? Object
        : _typeorm1.Repository,
      typeof _typeorm1.DataSource === 'undefined'
        ? Object
        : _typeorm1.DataSource,
    ]),
  ],
  AdminService
);

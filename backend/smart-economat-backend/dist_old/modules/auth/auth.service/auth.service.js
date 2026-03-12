'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'AuthService', {
  enumerable: true,
  get: function () {
    return AuthService;
  },
});
const _common = require('@nestjs/common');
const _typeorm = require('@nestjs/typeorm');
const _typeorm1 = require('typeorm');
const _bcrypt = /*#__PURE__*/ _interop_require_wildcard(require('bcrypt'));
const _jwt = require('@nestjs/jwt');
const _usuarioentity = require('../../usuario/usuario.entity/usuario.entity');
const _i18nhelper = require('../../../common/helpers/i18n.helper');
const _usuarioenums = require('../../usuario/enums/usuario.enums');
const _mailservice = require('../mail.service');
const _crypto = /*#__PURE__*/ _interop_require_wildcard(require('crypto'));
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
let AuthService = class AuthService {
  async register(dto) {
    return await this.dataSource.transaction(async (manager) => {
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
      const existing = await manager.findOne(_usuarioentity.Usuario, {
        where: whereConditions,
      });
      if (existing) {
        throw new _common.ConflictException(
          _i18nhelper.I18nHelper.getError('USER_OR_EMAIL_ALREADY_REGISTERED')
        );
      }
      const usuario = manager.create(_usuarioentity.Usuario, {
        ...dto,
        status: _usuarioenums.UserStatus.INACTIVE,
        rol: _usuarioenums.rolUsuario.ALUMNO,
      });
      await manager.save(usuario);
      return this.generateToken(usuario);
    });
  }
  async login(dto) {
    const usuario = await this.usuarioRepo
      .createQueryBuilder('usuario')
      .where('(usuario.email = :email OR usuario.username = :email)', {
        email: dto.email,
      })
      .addSelect('usuario.password')
      .getOne();
    if (!usuario || !(await _bcrypt.compare(dto.password, usuario.password))) {
      throw new _common.BadRequestException(
        _i18nhelper.I18nHelper.getError('INVALID_CREDENTIALS')
      );
    }
    if (usuario.status === _usuarioenums.UserStatus.INACTIVE) {
      throw new _common.BadRequestException(
        _i18nhelper.I18nHelper.getError('ACCOUNT_INACTIVE')
      );
    }
    if (usuario.status === _usuarioenums.UserStatus.BLOCKED) {
      throw new _common.BadRequestException(
        _i18nhelper.I18nHelper.getError('ACCOUNT_BLOCKED')
      );
    }
    const tokenData = this.generateToken(usuario);
    return {
      ...tokenData,
      requirePasswordChange: usuario.mustChangePassword,
    };
  }
  async forgotPassword(email) {
    if (!email) {
      return;
    }
    const usuario = await this.usuarioRepo.findOne({
      where: {
        email,
      },
    });
    if (!usuario) {
      return;
    }
    const token = _crypto.randomBytes(32).toString('hex');
    const hashedToken = _crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    usuario.passwordResetToken = hashedToken;
    usuario.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);
    await this.usuarioRepo.save(usuario);
    try {
      if (usuario.email) {
        await this.mailService.sendPasswordResetEmail(usuario.email, token);
      }
    } catch (error) {
      console.error('Error sending password reset email:', error);
    }
  }
  async resetPassword(token, newPassword) {
    const hashedToken = _crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    const usuario = await this.usuarioRepo.findOne({
      where: {
        passwordResetToken: hashedToken,
      },
      select: ['id', 'passwordResetToken', 'passwordResetExpires'],
    });
    if (
      !usuario ||
      !usuario.passwordResetExpires ||
      usuario.passwordResetExpires < new Date()
    ) {
      throw new _common.BadRequestException(
        _i18nhelper.I18nHelper.getError('EL_TOKEN_ES_INV_LIDO_O_HA_EXPIRADO')
      );
    }
    usuario.password = newPassword;
    usuario.passwordResetToken = null;
    usuario.passwordResetExpires = null;
    usuario.mustChangePassword = false;
    await this.usuarioRepo.save(usuario);
  }
  async changePassword(userId, currentPassword, newPassword) {
    const usuario = await this.usuarioRepo
      .createQueryBuilder('usuario')
      .where('usuario.id = :id', {
        id: userId,
      })
      .addSelect('usuario.password')
      .getOne();
    if (!usuario) {
      throw new _common.BadRequestException(
        _i18nhelper.I18nHelper.getError('USER_NOT_FOUND')
      );
    }
    if (!(await _bcrypt.compare(currentPassword, usuario.password))) {
      throw new _common.BadRequestException(
        _i18nhelper.I18nHelper.getError('LA_CONTRASE_A_ACTUAL_ES_INCORRECTA')
      );
    }
    usuario.password = newPassword;
    usuario.mustChangePassword = false;
    await this.usuarioRepo.save(usuario);
  }
  generateToken(usuario) {
    const payload = {
      sub: usuario.id,
      username: usuario.username,
      role: usuario.rol,
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
  constructor(usuarioRepo, jwtService, dataSource, mailService) {
    this.usuarioRepo = usuarioRepo;
    this.jwtService = jwtService;
    this.dataSource = dataSource;
    this.mailService = mailService;
  }
};
AuthService = _ts_decorate(
  [
    (0, _common.Injectable)(),
    _ts_param(0, (0, _typeorm.InjectRepository)(_usuarioentity.Usuario)),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [
      typeof _typeorm1.Repository === 'undefined'
        ? Object
        : _typeorm1.Repository,
      typeof _jwt.JwtService === 'undefined' ? Object : _jwt.JwtService,
      typeof _typeorm1.DataSource === 'undefined'
        ? Object
        : _typeorm1.DataSource,
      typeof _mailservice.MailService === 'undefined'
        ? Object
        : _mailservice.MailService,
    ]),
  ],
  AuthService
);

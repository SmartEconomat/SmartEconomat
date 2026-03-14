'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'ProfesorService', {
  enumerable: true,
  get: function () {
    return ProfesorService;
  },
});
const _i18nhelper = require('../../../common/helpers/i18n.helper');
const _common = require('@nestjs/common');
const _typeorm = require('@nestjs/typeorm');
const _typeorm1 = require('typeorm');
const _profesorentity = require('../profesor.entity/profesor.entity');
const _alumnoslotentity = require('../profesor.entity/alumno-slot.entity');
const _usuarioenums = require('../../usuario/enums/usuario.enums');
const _bcrypt = /*#__PURE__*/ _interop_require_wildcard(require('bcrypt'));
const _nodecrypto = require('node:crypto');
const _usuarioentity = require('../../usuario/usuario.entity/usuario.entity');
const _alumnoentity = require('../../alumno/alumno.entity/alumno.entity');
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
let ProfesorService = class ProfesorService {
  async register(dto) {
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
        user,
        cial: dto.cial,
      });
      await manager.save(profesor);
      return {
        message: _i18nhelper.I18nHelper.translate(
          'messages.PROFESOR_REGISTRADO_CON_XITO_ESPERANDO_A'
        ),
        id: profesor.id,
        username: user.username,
      };
    });
  }
  async createSlot(userId, dto) {
    const profesor = await this.profesorRepo.findOne({
      where: {
        user: {
          id: userId,
        },
      },
    });
    if (!profesor) {
      throw new _common.NotFoundException(
        _i18nhelper.I18nHelper.getError('PROFESSOR_PROFILE_NOT_FOUND')
      );
    }
    const existingSlot = await this.slotRepo.findOne({
      where: {
        profesor: {
          id: profesor.id,
        },
        aula: dto.aula,
        numeroClase: dto.numeroClase,
      },
    });
    if (existingSlot) {
      throw new _common.ConflictException(
        'Slot already exists for this aula and numeroClase'
      );
    }
    const slot = this.slotRepo.create({
      profesor,
      aula: dto.aula,
      numeroClase: dto.numeroClase,
    });
    return this.slotRepo.save(slot);
  }
  async activateAlumno(profesorUserId, alumnoId) {
    return this.dataSource.transaction(async (manager) => {
      const profesor = await manager.findOne(_profesorentity.Profesor, {
        where: {
          user: {
            id: profesorUserId,
          },
        },
      });
      if (!profesor)
        throw new _common.NotFoundException(
          _i18nhelper.I18nHelper.getError('PROFESOR_NOT_FOUND')
        );
      const alumno = await manager.findOne(_alumnoentity.Alumno, {
        where: {
          id: alumnoId,
          slot: {
            profesor: {
              id: profesor.id,
            },
          },
        },
        relations: ['user', 'slot', 'slot.profesor'],
      });
      if (!alumno)
        throw new _common.NotFoundException(
          'Alumno no pertenece a este profesor o no existe'
        );
      alumno.user.status = _usuarioenums.UserStatus.ACTIVE;
      await manager.save(alumno.user);
      return {
        message: _i18nhelper.I18nHelper.translate(
          'messages.ALUMNO_ACTIVADO_CORRECTAMENTE'
        ),
      };
    });
  }
  async getAlumnos(profesorUserId) {
    const profesor = await this.profesorRepo.findOne({
      where: {
        user: {
          id: profesorUserId,
        },
      },
    });
    if (!profesor)
      throw new _common.NotFoundException(
        _i18nhelper.I18nHelper.getError('PROFESOR_NOT_FOUND')
      );
    const result = await this.dataSource
      .getRepository(_alumnoentity.Alumno)
      .find({
        where: {
          slot: {
            profesor: {
              id: profesor.id,
            },
          },
        },
        relations: ['user', 'slot'],
      });
    return result.map((alumno) => ({
      id: alumno.id,
      username: alumno.user.username,
      status: alumno.user.status,
      aula: alumno.slot.aula,
      numeroClase: alumno.slot.numeroClase,
    }));
  }
  async forcePasswordReset(profesorUserId, alumnoId) {
    const profesor = await this.profesorRepo.findOne({
      where: {
        user: {
          id: profesorUserId,
        },
      },
    });
    if (!profesor)
      throw new _common.NotFoundException(
        _i18nhelper.I18nHelper.getError('PROFESOR_NOT_FOUND')
      );
    const alumno = await this.dataSource
      .getRepository(_alumnoentity.Alumno)
      .findOne({
        where: {
          id: alumnoId,
          slot: {
            profesor: {
              id: profesor.id,
            },
          },
        },
        relations: ['user', 'slot', 'slot.profesor'],
      });
    if (!alumno) {
      throw new _common.NotFoundException(
        'Alumno no pertenece a este profesor o no existe'
      );
    }
    const chars =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let provisionalPassword = '';
    const bytes = (0, _nodecrypto.randomBytes)(8);
    for (let i = 0; i < 8; i++) {
      provisionalPassword += chars[bytes[i] % chars.length];
    }
    alumno.user.password = provisionalPassword;
    alumno.user.mustChangePassword = true;
    alumno.user.passwordResetToken = null;
    alumno.user.passwordResetExpires = null;
    await this.dataSource
      .getRepository(_usuarioentity.Usuario)
      .save(alumno.user);
    return {
      message: _i18nhelper.I18nHelper.translate(
        'messages.CONTRASE_A_RESTABLECIDA_EXITOSAMENTE_ENT_1'
      ),
      provisionalPassword,
      mustChangePassword: true,
    };
  }
  constructor(profesorRepo, slotRepo, dataSource) {
    this.profesorRepo = profesorRepo;
    this.slotRepo = slotRepo;
    this.dataSource = dataSource;
  }
};
ProfesorService = _ts_decorate(
  [
    (0, _common.Injectable)(),
    _ts_param(0, (0, _typeorm.InjectRepository)(_profesorentity.Profesor)),
    _ts_param(1, (0, _typeorm.InjectRepository)(_alumnoslotentity.AlumnoSlot)),
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
  ProfesorService
);

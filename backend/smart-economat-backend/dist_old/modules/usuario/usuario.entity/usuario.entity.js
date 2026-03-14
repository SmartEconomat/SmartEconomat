'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
function _export(target, all) {
  for (var name in all)
    Object.defineProperty(target, name, {
      enumerable: true,
      get: Object.getOwnPropertyDescriptor(all, name).get,
    });
}
_export(exports, {
  get Rol() {
    return _usuarioenums.rolUsuario;
  },
  get Usuario() {
    return Usuario;
  },
});
const _typeorm = require('typeorm');
const _baseentity = require('../../../common/entities/base.entity');
const _bcrypt = /*#__PURE__*/ _interop_require_wildcard(require('bcrypt'));
const _usuarioenums = require('../enums/usuario.enums');
const _recepcionentity = require('../../recepcion/recepcion.entity/recepcion.entity');
const _movimientoentity = require('../../movimiento/movimiento.entity/movimiento.entity');
const _incidenciaentity = require('../../incidencia/incidencia.entity/incidencia.entity');
const _archivoentity = require('../../archivo/archivo.entity/archivo.entity');
const _profesorentity = require('../../profesor/profesor.entity/profesor.entity');
const _alumnoentity = require('../../alumno/alumno.entity/alumno.entity');
const _pedidoentity = require('../../pedido/pedido.entity/pedido.entity');
const _rolentity = require('../../roles/entities/rol.entity');
const _permisoentity = require('../../permisos/entities/permiso.entity');
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
let Usuario = class Usuario extends _baseentity.BaseEntity {
  async hashPassword() {
    if (this.password && !this.password.startsWith('$2b$')) {
      this.password = await _bcrypt.hash(this.password, 10);
    }
  }
  async validarPassword(plainPassword) {
    return _bcrypt.compare(plainPassword, this.password);
  }
};
_ts_decorate(
  [
    (0, _typeorm.Column)({
      type: 'varchar',
      length: 100,
      unique: true,
    }),
    _ts_metadata('design:type', String),
  ],
  Usuario.prototype,
  'username',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Column)({
      type: 'varchar',
      length: 100,
      select: false,
    }),
    _ts_metadata('design:type', String),
  ],
  Usuario.prototype,
  'password',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Column)({
      type: 'varchar',
      length: 255,
      unique: true,
      nullable: true,
    }),
    _ts_metadata('design:type', Object),
  ],
  Usuario.prototype,
  'email',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Column)({
      type: 'enum',
      enum: _usuarioenums.rolUsuario,
      default: _usuarioenums.rolUsuario.ALUMNO,
    }),
    _ts_metadata(
      'design:type',
      typeof _usuarioenums.rolUsuario === 'undefined'
        ? Object
        : _usuarioenums.rolUsuario
    ),
  ],
  Usuario.prototype,
  'rol',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Index)('idx_usuario_status', ['status']),
    (0, _typeorm.Column)({
      type: 'enum',
      enum: _usuarioenums.UserStatus,
      default: _usuarioenums.UserStatus.INACTIVE,
    }),
    _ts_metadata(
      'design:type',
      typeof _usuarioenums.UserStatus === 'undefined'
        ? Object
        : _usuarioenums.UserStatus
    ),
  ],
  Usuario.prototype,
  'status',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Column)({
      type: 'varchar',
      nullable: true,
      select: false,
    }),
    _ts_metadata('design:type', Object),
  ],
  Usuario.prototype,
  'passwordResetToken',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Column)({
      type: 'timestamptz',
      nullable: true,
    }),
    _ts_metadata('design:type', Object),
  ],
  Usuario.prototype,
  'passwordResetExpires',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Column)({
      type: 'boolean',
      default: false,
      name: 'must_change_password',
    }),
    _ts_metadata('design:type', Boolean),
  ],
  Usuario.prototype,
  'mustChangePassword',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.OneToMany)(
      () => _pedidoentity.Pedido,
      (pedido) => pedido.usuario
    ),
    _ts_metadata(
      'design:type',
      typeof Relation === 'undefined' ? Object : Relation
    ),
  ],
  Usuario.prototype,
  'pedidos',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.OneToMany)(
      () => _recepcionentity.Recepcion,
      (recepcion) => recepcion.usuario
    ),
    _ts_metadata(
      'design:type',
      typeof Relation === 'undefined' ? Object : Relation
    ),
  ],
  Usuario.prototype,
  'recepciones',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.OneToMany)(
      () => _movimientoentity.Movimiento,
      (mov) => mov.usuario
    ),
    _ts_metadata(
      'design:type',
      typeof Relation === 'undefined' ? Object : Relation
    ),
  ],
  Usuario.prototype,
  'movimientos',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.OneToMany)(
      () => _incidenciaentity.Incidencia,
      (incidencia) => incidencia.usuarioResolutor
    ),
    _ts_metadata(
      'design:type',
      typeof Relation === 'undefined' ? Object : Relation
    ),
  ],
  Usuario.prototype,
  'incidenciasResueltas',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.OneToMany)(
      () => _archivoentity.Archivo,
      (archivo) => archivo.usuario
    ),
    _ts_metadata(
      'design:type',
      typeof Relation === 'undefined' ? Object : Relation
    ),
  ],
  Usuario.prototype,
  'archivos',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.OneToOne)(
      () => _profesorentity.Profesor,
      (profesor) => profesor.user
    ),
    _ts_metadata(
      'design:type',
      typeof Relation === 'undefined' ? Object : Relation
    ),
  ],
  Usuario.prototype,
  'profesor',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.OneToOne)(
      () => _alumnoentity.Alumno,
      (alumno) => alumno.user
    ),
    _ts_metadata(
      'design:type',
      typeof Relation === 'undefined' ? Object : Relation
    ),
  ],
  Usuario.prototype,
  'alumno',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.ManyToMany)(
      () => _rolentity.Rol,
      (rol) => rol.usuarios
    ),
    (0, _typeorm.JoinTable)({
      name: 'usuario_rol',
      joinColumn: {
        name: 'usuario_id',
        referencedColumnName: 'id',
      },
      inverseJoinColumn: {
        name: 'rol_id',
        referencedColumnName: 'id',
      },
    }),
    _ts_metadata('design:type', Array),
  ],
  Usuario.prototype,
  'roles',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.ManyToMany)(() => _permisoentity.Permiso),
    (0, _typeorm.JoinTable)({
      name: 'usuario_permiso_adicional',
      joinColumn: {
        name: 'usuario_id',
        referencedColumnName: 'id',
      },
      inverseJoinColumn: {
        name: 'permiso_id',
        referencedColumnName: 'id',
      },
    }),
    _ts_metadata('design:type', Array),
  ],
  Usuario.prototype,
  'permisosAdicionales',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.ManyToMany)(() => _permisoentity.Permiso),
    (0, _typeorm.JoinTable)({
      name: 'usuario_permiso_excluido',
      joinColumn: {
        name: 'usuario_id',
        referencedColumnName: 'id',
      },
      inverseJoinColumn: {
        name: 'permiso_id',
        referencedColumnName: 'id',
      },
    }),
    _ts_metadata('design:type', Array),
  ],
  Usuario.prototype,
  'permisosExcluidos',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Column)({
      type: 'boolean',
      default: true,
    }),
    _ts_metadata('design:type', Boolean),
  ],
  Usuario.prototype,
  'activo',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.BeforeInsert)(),
    (0, _typeorm.BeforeUpdate)(),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', []),
    _ts_metadata('design:returntype', Promise),
  ],
  Usuario.prototype,
  'hashPassword',
  null
);
Usuario = _ts_decorate(
  [
    (0, _typeorm.Entity)({
      name: 'usuario',
    }),
    (0, _typeorm.Index)(['username']),
    (0, _typeorm.Index)(['email']),
  ],
  Usuario
);

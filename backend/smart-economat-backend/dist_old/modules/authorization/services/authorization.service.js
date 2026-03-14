'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'AuthorizationService', {
  enumerable: true,
  get: function () {
    return AuthorizationService;
  },
});
const _i18nhelper = require('../../../common/helpers/i18n.helper');
const _common = require('@nestjs/common');
const _typeorm = require('@nestjs/typeorm');
const _typeorm1 = require('typeorm');
const _cachemanager = require('@nestjs/cache-manager');
const _usuarioentity = require('../../usuario/usuario.entity/usuario.entity');
const _permisoentity = require('../../permisos/entities/permiso.entity');
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
let AuthorizationService = class AuthorizationService {
  /**
   * Obtiene todos los permisos de un usuario (desde cache o BD).
   * Utiliza consulta optimizada con QueryBuilder.
   *
   * @param userId - ID del usuario
   * @returns Array de códigos de permisos (ej: ['usuarios:listar', 'productos:crear'])
   */ async getUserPermissions(userId) {
    const cacheKey = `${this.CACHE_PREFIX}${userId}`;
    try {
      const cached = await this.cacheManager.get(cacheKey);
      if (cached) {
        this.logger.debug(
          `Permisos obtenidos desde cache para usuario ${userId}`
        );
        return cached;
      }
      this.logger.debug(
        `Cache miss - Consultando permisos desde BD para usuario ${userId}`
      );
      const permisos = await this.loadUserPermissionsFromDB(userId);
      await this.cacheManager.set(cacheKey, permisos, this.CACHE_TTL);
      return permisos;
    } catch (error) {
      this.logger.error(
        `Error al obtener permisos del usuario ${userId}:`,
        error
      );
      return this.loadUserPermissionsFromDB(userId);
    }
  }
  /**
   * Carga los permisos del usuario desde la base de datos considerando:
   * (Permisos de Roles Activos) + (Permisos Adicionales) - (Permisos Excluidos)
   *
   * @param userId - ID del usuario
   * @returns Array de códigos de permisos únicos
   */ async loadUserPermissionsFromDB(userId) {
    const usuario = await this.usuarioRepo.findOne({
      where: {
        id: userId,
        activo: true,
      },
      select: ['id', 'rol', 'activo'],
    });
    if (!usuario) return [];
    const permisosRoles = await this.permisoRepo
      .createQueryBuilder('permiso')
      .innerJoin('permiso.roles', 'rol')
      .innerJoin(
        'usuario_rol',
        'ur',
        'ur.rol_id = rol.id AND ur.usuario_id = :userId',
        {
          userId,
        }
      )
      .andWhere('rol.activo = :rolActivo', {
        rolActivo: true,
      })
      .andWhere('permiso.activo = :permisoActivo', {
        permisoActivo: true,
      })
      .select(['permiso.codigo'])
      .getMany();
    const permisosPlantilla = await this.permisoRepo
      .createQueryBuilder('permiso')
      .innerJoin('plantilla_rol_permiso', 'prp', 'prp.permiso_id = permiso.id')
      .innerJoin(
        'plantilla_rol',
        'plantilla',
        'plantilla.id = prp.plantilla_rol_id'
      )
      .where('plantilla.nombre = :rolNombre', {
        rolNombre: usuario.rol,
      })
      .andWhere('plantilla.activo = :plantillaActivo', {
        plantillaActivo: true,
      })
      .andWhere('permiso.activo = :permisoActivo', {
        permisoActivo: true,
      })
      .select(['permiso.codigo'])
      .getMany();
    const codigosBase = [
      ...permisosRoles.map((p) => p.codigo),
      ...permisosPlantilla.map((p) => p.codigo),
    ];
    const adicionales = await this.permisoRepo
      .createQueryBuilder('permiso')
      .innerJoin(
        'usuario_permiso_adicional',
        'upa',
        'upa.permiso_id = permiso.id'
      )
      .where('upa.usuario_id = :userId', {
        userId,
      })
      .andWhere('permiso.activo = :permisoActivo', {
        permisoActivo: true,
      })
      .select(['permiso.codigo'])
      .getMany();
    const codigosAdicionales = adicionales.map((p) => p.codigo);
    const excluidos = await this.permisoRepo
      .createQueryBuilder('permiso')
      .innerJoin(
        'usuario_permiso_excluido',
        'upe',
        'upe.permiso_id = permiso.id'
      )
      .where('upe.usuario_id = :userId', {
        userId,
      })
      .select(['permiso.codigo'])
      .getMany();
    const codigosExcluidos = excluidos.map((p) => p.codigo);
    const setFinal = new Set([...codigosBase, ...codigosAdicionales]);
    codigosExcluidos.forEach((c) => setFinal.delete(c));
    return Array.from(setFinal);
  }
  /**
   * Valida si un usuario tiene TODOS los permisos especificados (AND).
   *
   * @param userId - ID del usuario
   * @param requiredPermissions - Array de permisos requeridos
   * @returns true si tiene todos los permisos, false en caso contrario
   */ async userHasAllPermissions(userId, requiredPermissions) {
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }
    const userPermissions = await this.getUserPermissions(userId);
    return requiredPermissions.every((required) =>
      userPermissions.includes(required)
    );
  }
  /**
   * Valida si un usuario tiene AL MENOS UNO de los permisos especificados (OR).
   *
   * @param userId - ID del usuario
   * @param requiredPermissions - Array de permisos requeridos
   * @returns true si tiene al menos uno de los permisos, false en caso contrario
   */ async userHasAnyPermission(userId, requiredPermissions) {
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }
    const userPermissions = await this.getUserPermissions(userId);
    return requiredPermissions.some((required) =>
      userPermissions.includes(required)
    );
  }
  /**
   * Invalida el cache de permisos de un usuario específico.
   * Se debe llamar cuando se modifican los roles o permisos del usuario.
   *
   * @param userId - ID del usuario
   */ async invalidateUserCache(userId) {
    const cacheKey = `${this.CACHE_PREFIX}${userId}`;
    try {
      await this.cacheManager.del(cacheKey);
      this.logger.log(`Cache invalidado para usuario ${userId}`);
    } catch (error) {
      this.logger.error(
        `Error al invalidar cache del usuario ${userId}:`,
        error
      );
    }
  }
  /**
   * Invalida el cache de permisos de múltiples usuarios.
   * Se debe llamar cuando se modifican permisos de un rol que afecta a múltiples usuarios.
   *
   * @param userIds - Array de IDs de usuarios
   */ async invalidateUsersCache(userIds) {
    try {
      await Promise.all(
        userIds.map((userId) => this.invalidateUserCache(userId))
      );
      this.logger.log(`Cache invalidado para ${userIds.length} usuarios`);
    } catch (error) {
      this.logger.error(
        _i18nhelper.I18nHelper.translate(
          'logs.ERROR_AL_INVALIDAR_CACHE_DE_USUARIOS'
        ),
        error
      );
    }
  }
  /**
   * Invalida todo el cache de permisos.
   * Se debe llamar cuando hay cambios masivos en el sistema de permisos.
   */ async invalidateAllCache() {
    try {
      const cache = this.cacheManager;
      await cache.clear();
      this.logger.warn(
        _i18nhelper.I18nHelper.translate(
          'logs.TODO_EL_CACHE_DE_PERMISOS_HA_SIDO_INVALI'
        )
      );
    } catch (error) {
      this.logger.error(
        _i18nhelper.I18nHelper.translate(
          'logs.ERROR_AL_INVALIDAR_TODO_EL_CACHE'
        ),
        error
      );
    }
  }
  /**
   * Precarga los permisos de un usuario en el cache.
   * Útil para optimizar la primera petición después del login.
   *
   * @param userId - ID del usuario
   */ async preloadUserPermissions(userId) {
    const permisos = await this.loadUserPermissionsFromDB(userId);
    const cacheKey = `${this.CACHE_PREFIX}${userId}`;
    try {
      await this.cacheManager.set(cacheKey, permisos, this.CACHE_TTL);
      this.logger.debug(`Permisos precargados en cache para usuario ${userId}`);
    } catch (error) {
      this.logger.error(`Error al precargar permisos en cache:`, error);
    }
    return permisos;
  }
  constructor(usuarioRepo, permisoRepo, cacheManager) {
    this.usuarioRepo = usuarioRepo;
    this.permisoRepo = permisoRepo;
    this.cacheManager = cacheManager;
    this.logger = new _common.Logger(AuthorizationService.name);
    this.CACHE_TTL = 300;
    this.CACHE_PREFIX = 'user:permissions:';
  }
};
AuthorizationService = _ts_decorate(
  [
    (0, _common.Injectable)(),
    _ts_param(0, (0, _typeorm.InjectRepository)(_usuarioentity.Usuario)),
    _ts_param(1, (0, _typeorm.InjectRepository)(_permisoentity.Permiso)),
    _ts_param(2, (0, _common.Inject)(_cachemanager.CACHE_MANAGER)),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [
      typeof _typeorm1.Repository === 'undefined'
        ? Object
        : _typeorm1.Repository,
      typeof _typeorm1.Repository === 'undefined'
        ? Object
        : _typeorm1.Repository,
      typeof Cache === 'undefined' ? Object : Cache,
    ]),
  ],
  AuthorizationService
);

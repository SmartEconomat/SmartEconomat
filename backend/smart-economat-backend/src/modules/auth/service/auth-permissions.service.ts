import { I18nHelper } from '../../../common/helpers/i18n.helper';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';
import { Permiso } from '../../permisos/permiso.entity/permiso.entity';
import {
  resolveSherlockEffectivePermissions,
  getRolPrincipal,
} from '../../sherlock-auth/utils/access.utils';
import { SYSTEM_ROLES } from '../../../common/constants/system-roles.constants';

/**
 * Documentación en español.
 */
@Injectable()
export class AuthPermissionsService {
  private readonly logger = new Logger(AuthPermissionsService.name);
  private readonly CACHE_TTL = 300;
  private readonly CACHE_PREFIX = 'user:permissions:';

  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(Permiso)
    private readonly permisoRepo: Repository<Permiso>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache
  ) {}

  /**
   * Documentación en español.
   */
  async getUserPermissions(userId: string): Promise<string[]> {
    const cacheKey = `${this.CACHE_PREFIX}${userId}`;

    try {
      const cached = await this.cacheManager.get<string[]>(cacheKey);
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
      console.error('AuthPermissionsService Error:', error);

      return this.loadUserPermissionsFromDB(userId);
    }
  }

  /**
   * Documentación en español.
   */
  private async loadUserPermissionsFromDB(userId: string): Promise<string[]> {
    const usuario = await this.usuarioRepo.findOne({
      where: { id: userId, activo: true },
      select: ['id', 'rol', 'activo'],
      relations: ['roles'],
    });

    if (!usuario) return [];

    const rolPrincipal = getRolPrincipal(usuario.roles, usuario.rol);
    if (rolPrincipal === SYSTEM_ROLES.SUPER_ADMIN) {
      const todosLosPermisos = await this.permisoRepo.find({
        where: { activo: true },
        select: ['codigo'],
      });
      return todosLosPermisos.map((p) => p.codigo);
    }

    const permisosRoles = await this.permisoRepo
      .createQueryBuilder('permiso')
      .innerJoin('permiso.roles', 'rol')
      .innerJoin('rol.usuarios', 'userJoin')
      .where('userJoin.id = :userId', { userId })
      .andWhere('rol.activo = :rolActivo', { rolActivo: true })
      .andWhere('permiso.activo = :permisoActivo', { permisoActivo: true })
      .select(['permiso.codigo'])
      .getMany();

    const permisosPlantillaDinamica = await this.permisoRepo
      .createQueryBuilder('permiso')
      .innerJoin('permiso.plantillasRoles', 'plantilla')
      .innerJoin('plantilla.roles', 'rolPlantilla')
      .innerJoin('rolPlantilla.usuarios', 'usuarioPlantilla')
      .where('usuarioPlantilla.id = :userId', { userId })
      .andWhere('rolPlantilla.activo = :rolActivo', { rolActivo: true })
      .andWhere('plantilla.activo = :plantillaActivo', {
        plantillaActivo: true,
      })
      .andWhere('permiso.activo = :permisoActivo', { permisoActivo: true })
      .select(['permiso.codigo'])
      .getMany();

    const codigosBase = [
      ...permisosRoles.map((p) => p.codigo),
      ...permisosPlantillaDinamica.map((p) => p.codigo),
    ];

    const adicionales = await this.permisoRepo
      .createQueryBuilder('permiso')
      .innerJoin('permiso.usuariosAdicionales', 'usuarioJoin')
      .where('usuarioJoin.id = :userId', { userId })
      .andWhere('permiso.activo = :permisoActivo', { permisoActivo: true })
      .select(['permiso.codigo'])
      .getMany();

    const codigosAdicionales = adicionales.map((p) => p.codigo);

    const excluidos = await this.permisoRepo
      .createQueryBuilder('permiso')
      .innerJoin('permiso.usuariosExcluidos', 'usuarioExclJoin')
      .where('usuarioExclJoin.id = :userId', { userId })
      .select(['permiso.codigo'])
      .getMany();

    const codigosExcluidos = excluidos.map((p) => p.codigo);

    const result = resolveSherlockEffectivePermissions({
      role: rolPrincipal,
      rolePermissions: codigosBase,
      directPermissions: codigosAdicionales,
      excludedPermissions: codigosExcluidos,
    });
    this.logger.debug(
      `Permisos finales para usuario ${userId}: ${JSON.stringify(result)}. (Base: ${codigosBase.length}, Adicionales: ${codigosAdicionales.length}, Excluidos: ${codigosExcluidos.length})`
    );

    return result;
  }

  /**
   * Documentación en español.
   */
  async userHasAllPermissions(
    userId: string,
    requiredPermissions: string[]
  ): Promise<boolean> {
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const userPermissions = await this.getUserPermissions(userId);
    return requiredPermissions.every((required) =>
      userPermissions.includes(required)
    );
  }

  /**
   * Documentación en español.
   */
  async userHasAnyPermission(
    userId: string,
    requiredPermissions: string[]
  ): Promise<boolean> {
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const userPermissions = await this.getUserPermissions(userId);
    return requiredPermissions.some((required) =>
      userPermissions.includes(required)
    );
  }

  /**
   * Documentación en español.
   */
  async invalidateUserCache(userId: string): Promise<void> {
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
   * Documentación en español.
   */
  async invalidateUsersCache(userIds: string[]): Promise<void> {
    try {
      await Promise.all(
        userIds.map((userId) => this.invalidateUserCache(userId))
      );
      this.logger.log(`Cache invalidado para ${userIds.length} usuarios`);
    } catch (error) {
      this.logger.error(
        I18nHelper.translate('logs.ERROR_AL_INVALIDAR_CACHE_DE_USUARIOS'),
        error
      );
    }
  }

  /**
   * Documentación en español.
   */
  async invalidateAllCache(): Promise<void> {
    try {
      const cache = this.cacheManager as unknown as {
        clear: () => Promise<void>;
      };
      await cache.clear();
      this.logger.warn(
        I18nHelper.translate('logs.TODO_EL_CACHE_DE_PERMISOS_HA_SIDO_INVALI')
      );
    } catch (error) {
      this.logger.error(
        I18nHelper.translate('logs.ERROR_AL_INVALIDAR_TODO_EL_CACHE'),
        error
      );
    }
  }

  /**
   * Documentación en español.
   */
  async preloadUserPermissions(userId: string): Promise<string[]> {
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
}

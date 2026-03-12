import { I18nHelper } from '../../../common/helpers/i18n.helper';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';
import { Permiso } from '../../permisos/permiso.entity/permiso.entity';

/**
 * Servicio centralizado de autorización con caching agresivo.
 * Responsable de:
 * - Cargar permisos de usuarios desde BD con consultas optimizadas
 * - Gestionar cache de permisos (Redis o memoria)
 * - Invalidar cache cuando cambian roles/permisos
 * - Validar permisos en < 5ms (con cache)
 */
@Injectable()
export class AuthorizationService {
  private readonly logger = new Logger(AuthorizationService.name);
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
   * Obtiene todos los permisos de un usuario (desde cache o BD).
   * Utiliza consulta optimizada con QueryBuilder.
   *
   * @param userId - ID del usuario
   * @returns Array de códigos de permisos (ej: ['usuarios:listar', 'productos:crear'])
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
      console.error('AuthorizationService Error:', error);

      return this.loadUserPermissionsFromDB(userId);
    }
  }

  /**
   * Carga los permisos del usuario desde la base de datos considerando:
   * (Permisos de Roles Activos) + (Permisos Adicionales) - (Permisos Excluidos)
   *
   * @param userId - ID del usuario
   * @returns Array de códigos de permisos únicos
   */
  private async loadUserPermissionsFromDB(userId: string): Promise<string[]> {
    const usuario = await this.usuarioRepo.findOne({
      where: { id: userId, activo: true },
      select: ['id', 'rol', 'activo'],
    });

    if (!usuario) return [];

    const permisosRoles = await this.permisoRepo
      .createQueryBuilder('permiso')
      .innerJoin('permiso.roles', 'rol')
      .innerJoin('rol.usuarios', 'userJoin')
      .where('userJoin.id = :userId', { userId })
      .andWhere('rol.activo = :rolActivo', { rolActivo: true })
      .andWhere('permiso.activo = :permisoActivo', { permisoActivo: true })
      .select(['permiso.codigo'])
      .getMany();

    const permisosPlantilla = await this.permisoRepo
      .createQueryBuilder('permiso')
      .innerJoin('permiso.plantillasRoles', 'plantilla')
      .where('plantilla.nombre = :rolNombre', { rolNombre: usuario.rol })
      .andWhere('plantilla.activo = :plantillaActivo', {
        plantillaActivo: true,
      })
      .andWhere('permiso.activo = :permisoActivo', { permisoActivo: true })
      .select(['permiso.codigo'])
      .getMany();

    const codigosBase = [
      ...permisosRoles.map((p) => p.codigo),
      ...permisosPlantilla.map((p) => p.codigo),
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

    const setFinal = new Set([...codigosBase, ...codigosAdicionales]);
    codigosExcluidos.forEach((c) => setFinal.delete(c));

    const result = Array.from(setFinal);
    this.logger.debug(
      `Permisos finales para usuario ${userId}: ${JSON.stringify(result)}. (Base: ${codigosBase.length}, Adicionales: ${codigosAdicionales.length}, Excluidos: ${codigosExcluidos.length})`
    );

    return result;
  }

  /**
   * Valida si un usuario tiene TODOS los permisos especificados (AND).
   *
   * @param userId - ID del usuario
   * @param requiredPermissions - Array de permisos requeridos
   * @returns true si tiene todos los permisos, false en caso contrario
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
   * Valida si un usuario tiene AL MENOS UNO de los permisos especificados (OR).
   *
   * @param userId - ID del usuario
   * @param requiredPermissions - Array de permisos requeridos
   * @returns true si tiene al menos uno de los permisos, false en caso contrario
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
   * Invalida el cache de permisos de un usuario específico.
   * Se debe llamar cuando se modifican los roles o permisos del usuario.
   *
   * @param userId - ID del usuario
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
   * Invalida el cache de permisos de múltiples usuarios.
   * Se debe llamar cuando se modifican permisos de un rol que afecta a múltiples usuarios.
   *
   * @param userIds - Array de IDs de usuarios
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
   * Invalida todo el cache de permisos.
   * Se debe llamar cuando hay cambios masivos en el sistema de permisos.
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
   * Precarga los permisos de un usuario en el cache.
   * Útil para optimizar la primera petición después del login.
   *
   * @param userId - ID del usuario
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

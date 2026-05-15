import { I18nHelper } from '../../../common/helpers/i18n.helper';
import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Rol } from '../rol.entity/rol.entity';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';
import { Permiso } from '../../permisos/permiso.entity/permiso.entity';
import { UsuarioRol } from '../usuario-rol.entity/usuario-rol.entity';
import { CreateRolDto } from '../dto/create-rol.dto';
import { UpdateRolDto } from '../dto/update-rol.dto';
import { AssignPermissionsDto } from '../dto/assign-permissions.dto';
import { AssignRoleToUserDto } from '../dto/assign-role-to-user.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { AuthPermissionsService } from '../../auth/service/auth-permissions.service';
import { SORTABLE_FIELDS } from '../../../common/constants/sortable-fields.constants';

/**
 * Servicio de dominio para roles.
 */
@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);

  /**
   * Construye la instancia configurada.
   * @undefined {Repository<Rol>} rolRepo - Entrada efectiva esperada por el contrato.
   * @undefined {Repository<Usuario>} usuarioRepo - Entrada efectiva esperada por el contrato.
   * @undefined {Repository<Permiso>} permisoRepo - Entrada efectiva esperada por el contrato.
   * @undefined {Repository<UsuarioRol>} usuarioRolRepo - Entrada efectiva esperada por el contrato.
   * @undefined {AuthPermissionsService} authPermissionsService - Entrada efectiva esperada por el contrato.
   */
  constructor(
    @InjectRepository(Rol)
    private readonly rolRepo: Repository<Rol>,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(Permiso)
    private readonly permisoRepo: Repository<Permiso>,
    @InjectRepository(UsuarioRol)
    private readonly usuarioRolRepo: Repository<UsuarioRol>,
    private readonly authPermissionsService: AuthPermissionsService
  ) {}

  /**
   * Crea create.
   *
   * @param dto Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
   */
  async create(dto: CreateRolDto): Promise<Rol> {
    const existente = await this.rolRepo.findOne({
      where: { nombre: dto.nombre },
    });
    if (existente) {
      throw new ConflictException(
        `Ya existe un rol con el nombre "${dto.nombre}"`
      );
    }

    const rol = this.rolRepo.create({
      nombre: dto.nombre,
      descripcion: dto.descripcion,
      esSistema: dto.esSistema || false,
      activo: dto.activo !== undefined ? dto.activo : true,
    });

    const savedRol = await this.rolRepo.save(rol);

    if (dto.permisoIds && dto.permisoIds.length > 0) {
      if (dto.esSistema) {
        const permisos = await this.permisoRepo.find({
          where: { id: In(dto.permisoIds) },
        });

        if (permisos.length !== dto.permisoIds.length) {
          throw new BadRequestException(
            I18nHelper.getError('SOME_PERMISSIONS_NOT_FOUND')
          );
        }

        savedRol.permisos = permisos;
        await this.rolRepo.save(savedRol);
      } else {
        await this.assignPermissions(savedRol.id, {
          permisoIds: dto.permisoIds,
        });
      }
    }

    return this.findOne(savedRol.id);
  }

  /**
   * Expone "upsertSystemRole" en smart-economat-backend (Nest).
   * @undefined {CreateRolDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<Rol>} Datos efectivos después de ejecutar la operación.
   */
  async upsertSystemRole(dto: CreateRolDto): Promise<Rol> {
    if (!dto.esSistema) {
      throw new BadRequestException(
        'upsertSystemRole solo admite roles marcados como de sistema'
      );
    }

    const permisos = dto.permisoIds?.length
      ? await this.permisoRepo.find({
          where: { id: In(dto.permisoIds) },
        })
      : [];

    if ((dto.permisoIds?.length ?? 0) !== permisos.length) {
      throw new BadRequestException(
        I18nHelper.getError('SOME_PERMISSIONS_NOT_FOUND')
      );
    }

    let rol = await this.rolRepo.findOne({
      where: { nombre: dto.nombre },
      relations: ['permisos'],
    });

    if (!rol) {
      rol = this.rolRepo.create({
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        esSistema: true,
        activo: dto.activo !== undefined ? dto.activo : true,
      });
    }

    rol.descripcion = dto.descripcion;
    rol.esSistema = true;
    rol.activo = dto.activo !== undefined ? dto.activo : true;
    rol.permisos = permisos;

    await this.rolRepo.save(rol);
    await this.invalidateCacheForRole(rol.id);

    return this.findOne(rol.id);
  }

  /**
   * Busca all.
   *
   * @param query Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
   */
  async findAll(query: PaginationQueryDto): Promise<PaginatedResponseDto<Rol>> {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 10, 50);
    const requestedSort = query.sortBy ?? 'nombre';
    const sortBy = SORTABLE_FIELDS.roles.includes(requestedSort)
      ? requestedSort
      : 'nombre';
    const order = query.order ?? 'ASC';

    const [data, total] = await this.rolRepo.findAndCount({
      relations: ['permisos'],
      order: { [sortBy]: order },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Busca all no pagination.
   * @returns Valor resultante de la operación.
   */
  /**
   * Expone "findAllNoPagination" en smart-economat-backend (Nest).
   * @undefined {Promise<Rol[]>} Datos efectivos después de ejecutar la operación.
   */
  async findAllNoPagination(): Promise<Rol[]> {
    return this.rolRepo.find({
      where: { activo: true },
      order: { nombre: 'ASC' },
    });
  }

  /**
   * Busca one.
   *
   * @param id Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
   */
  async findOne(id: string): Promise<Rol> {
    const rol = await this.rolRepo.findOne({
      where: { id },
      relations: ['permisos'],
    });

    if (!rol) {
      throw new NotFoundException(
        I18nHelper.getError('ROLE_NOT_FOUND', { id })
      );
    }

    return rol;
  }

  /**
   * Actualiza update.
   *
   * @param id Parámetro de entrada para la operación.
   * @param dto Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
   */
  async update(id: string, dto: UpdateRolDto): Promise<Rol> {
    const rol = await this.findOne(id);

    if (rol.esSistema && dto.esSistema === false) {
      throw new BadRequestException(
        'No se puede modificar el atributo "esSistema" de un rol de sistema'
      );
    }

    if (dto.nombre && dto.nombre !== rol.nombre) {
      const existente = await this.rolRepo.findOne({
        where: { nombre: dto.nombre },
      });
      if (existente) {
        throw new ConflictException(
          `Ya existe un rol con el nombre "${dto.nombre}"`
        );
      }
    }

    if (dto.permisoIds) {
      await this.assignPermissions(id, { permisoIds: dto.permisoIds });
    }

    Object.assign(rol, {
      nombre: dto.nombre,
      descripcion: dto.descripcion,
      activo: dto.activo,
    });

    await this.rolRepo.save(rol);

    await this.invalidateCacheForRole(id);

    return this.findOne(id);
  }

  /**
   * Elimina remove.
   *
   * @param id Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
   */
  async remove(id: string): Promise<void> {
    const rol = await this.findOne(id);

    if (rol.esSistema) {
      throw new BadRequestException(
        I18nHelper.getError('CANNOT_DELETE_SYSTEM_ROLE')
      );
    }

    const usuariosCount = await this.usuarioRolRepo.count({
      where: { rolId: id },
    });
    if (usuariosCount > 0) {
      throw new BadRequestException(
        `No se puede eliminar el rol. Está asignado a ${usuariosCount} usuario(s)`
      );
    }

    await this.rolRepo.softDelete(id);
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "assignPermissions" en smart-economat-backend (Nest).
   * @undefined {string} rolId - Entrada efectiva esperada por el contrato.
   * @undefined {AssignPermissionsDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {string | undefined} actorUserId - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<Rol>} Datos efectivos después de ejecutar la operación.
   */
  async assignPermissions(
    rolId: string,
    dto: AssignPermissionsDto,
    actorUserId?: string
  ): Promise<Rol> {
    const rol = await this.findOne(rolId);

    if (rol.esSistema) {
      throw new BadRequestException(
        'No se pueden modificar los permisos de un rol de sistema'
      );
    }

    const permisos = await this.permisoRepo.find({
      where: { id: In(dto.permisoIds) },
    });

    if (permisos.length !== dto.permisoIds.length) {
      throw new BadRequestException(
        I18nHelper.getError('SOME_PERMISSIONS_NOT_FOUND')
      );
    }

    rol.permisos = permisos;
    await this.rolRepo.save(rol);

    if (actorUserId) {
      await this.rolRepo.manager.query(
        `UPDATE rol_permiso SET asignado_por = $1 WHERE rol_id = $2`,
        [actorUserId, rolId]
      );
    }

    await this.invalidateCacheForRole(rolId);

    this.logger.log(
      `[RBAC] Permisos actualizados para rol ${rolId} (${rol.nombre}): ${dto.permisoIds.length} permisos asignados (actor: ${actorUserId ?? 'sistema'})`
    );

    return this.findOne(rolId);
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "assignRoleToUser" en smart-economat-backend (Nest).
   * @undefined {AssignRoleToUserDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {string | undefined} asignadoPor - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<UsuarioRol>} Datos efectivos después de ejecutar la operación.
   */
  async assignRoleToUser(
    dto: AssignRoleToUserDto,
    asignadoPor?: string
  ): Promise<UsuarioRol> {
    const usuario = await this.usuarioRepo.findOne({
      where: { id: dto.usuarioId },
    });
    if (!usuario) {
      throw new NotFoundException(
        `Usuario con ID "${dto.usuarioId}" no encontrado`
      );
    }

    const existente = await this.usuarioRolRepo.findOne({
      where: { usuarioId: dto.usuarioId, rolId: dto.rolId },
    });

    if (existente) {
      const prevActivo = existente.activo;
      existente.activo = dto.activo !== undefined ? dto.activo : true;
      const updated = await this.usuarioRolRepo.save(existente);
      await this.authPermissionsService.invalidateUserCache(dto.usuarioId);
      this.logger.log(
        `[RBAC] Rol ${dto.rolId} actualizado para usuario ${dto.usuarioId}: activo ${prevActivo} → ${existente.activo} (actor: ${asignadoPor ?? 'sistema'})`
      );
      return updated;
    }

    const usuarioRol = this.usuarioRolRepo.create({
      usuarioId: dto.usuarioId,
      rolId: dto.rolId,
      asignadoPor,
      activo: dto.activo !== undefined ? dto.activo : true,
    });

    const saved = await this.usuarioRolRepo.save(usuarioRol);

    await this.authPermissionsService.invalidateUserCache(dto.usuarioId);
    this.logger.log(
      `[RBAC] Rol ${dto.rolId} asignado a usuario ${dto.usuarioId} (actor: ${asignadoPor ?? 'sistema'})`
    );

    return saved;
  }

  /**
   * Elimina role from user.
   *
   * @param usuarioId Parámetro de entrada para la operación.
   * @param rolId Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
   */
  async removeRoleFromUser(usuarioId: string, rolId: string): Promise<void> {
    const usuarioRol = await this.usuarioRolRepo.findOne({
      where: { usuarioId, rolId },
    });

    if (!usuarioRol) {
      throw new NotFoundException(
        I18nHelper.getError('ROLE_ASSIGNMENT_NOT_FOUND')
      );
    }

    await this.usuarioRolRepo.remove(usuarioRol);

    await this.authPermissionsService.invalidateUserCache(usuarioId);
  }

  /**
   * Obtiene user roles.
   *
   * @param usuarioId Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
   */
  async getUserRoles(usuarioId: string): Promise<Rol[]> {
    const usuario = await this.usuarioRepo.findOne({
      where: { id: usuarioId },
      relations: ['roles'],
    });

    if (!usuario) {
      throw new NotFoundException(
        `Usuario con ID "${usuarioId}" no encontrado`
      );
    }

    return usuario.roles || [];
  }

  /**
   * Ejecuta la lógica de invalidate cache for role dentro del flujo de la aplicación.
   *
   * @param rolId Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
   */
  private async invalidateCacheForRole(rolId: string): Promise<void> {
    const usuarioRoles = await this.usuarioRolRepo.find({
      where: { rolId, activo: true },
      select: ['usuarioId'],
    });

    const userIds = usuarioRoles.map((ur) => ur.usuarioId);

    if (userIds.length > 0) {
      await this.authPermissionsService.invalidateUsersCache(userIds);
    }
  }
}

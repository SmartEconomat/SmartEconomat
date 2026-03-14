import { I18nHelper } from '../../../common/helpers/i18n.helper';
import {
  Injectable,
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

/**
 * Servicio para la gestión de roles y asignaciones.
 * Incluye invalidación de cache cuando hay cambios.
 */
@Injectable()
export class RolesService {
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
   * Crear un nuevo rol
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
      await this.assignPermissions(savedRol.id, {
        permisoIds: dto.permisoIds,
      });
    }

    return this.findOne(savedRol.id);
  }

  /**
   * Listar todos los roles con paginación
   */
  async findAll(query: PaginationQueryDto): Promise<PaginatedResponseDto<Rol>> {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 10, 50);
    const sortBy = query.sortBy ?? 'nombre';
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
   * Obtener todos los roles sin paginación (para selectores)
   */
  async findAllNoPagination(): Promise<Rol[]> {
    return this.rolRepo.find({
      where: { activo: true },
      order: { nombre: 'ASC' },
    });
  }

  /**
   * Obtener un rol por ID con sus permisos
   */
  async findOne(id: string): Promise<Rol> {
    const rol = await this.rolRepo.findOne({
      where: { id },
      relations: ['permisos'],
    });

    if (!rol) {
      throw new NotFoundException(`Rol con ID "${id}" no encontrado`);
    }

    return rol;
  }

  /**
   * Actualizar un rol
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
   * Eliminar un rol (soft delete)
   */
  async remove(id: string): Promise<void> {
    const rol = await this.findOne(id);

    if (rol.esSistema) {
      throw new BadRequestException(
        I18nHelper.getError('NO_SE_PUEDE_ELIMINAR_UN_ROL_DE_SISTEMA')
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
   * Asignar permisos a un rol
   */
  async assignPermissions(
    rolId: string,
    dto: AssignPermissionsDto
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
        I18nHelper.getError('ALGUNOS_PERMISOS_NO_EXISTEN')
      );
    }

    rol.permisos = permisos;
    await this.rolRepo.save(rol);

    await this.invalidateCacheForRole(rolId);

    return this.findOne(rolId);
  }

  /**
   * Asignar un rol a un usuario
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
      existente.activo = dto.activo !== undefined ? dto.activo : true;
      const updated = await this.usuarioRolRepo.save(existente);
      await this.authPermissionsService.invalidateUserCache(dto.usuarioId);
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

    return saved;
  }

  /**
   * Remover un rol de un usuario
   */
  async removeRoleFromUser(usuarioId: string, rolId: string): Promise<void> {
    const usuarioRol = await this.usuarioRolRepo.findOne({
      where: { usuarioId, rolId },
    });

    if (!usuarioRol) {
      throw new NotFoundException(
        I18nHelper.getError('ASIGNACI_N_DE_ROL_NO_ENCONTRADA')
      );
    }

    await this.usuarioRolRepo.remove(usuarioRol);

    await this.authPermissionsService.invalidateUserCache(usuarioId);
  }

  /**
   * Obtener roles de un usuario
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
   * Invalidar cache de todos los usuarios que tengan un rol específico
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

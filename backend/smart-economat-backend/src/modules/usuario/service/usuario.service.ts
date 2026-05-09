import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { UsuarioRepository } from '../repository/usuario.repository';
import { CreateUsuarioDto } from '../dto/create-usuario.dto';
import { I18nHelper } from '../../../common/helpers/i18n.helper';
import { Usuario } from '../usuario.entity/usuario.entity';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { AdminCreateUsuarioDto } from '../dto/admin-create-usuario.dto';
import { AdminUpdateUsuarioDto } from '../dto/admin-update-usuario.dto';

import { ChangePasswordDto } from '../dto/change-password.dto';
import * as bcrypt from 'bcrypt';
import { UserStatus, rolUsuario } from '../enums/usuario.enums';
import { Permiso } from '../../permisos/permiso.entity/permiso.entity';
import { AuthPermissionsService } from '../../auth/service/auth-permissions.service';
import { Profesor } from '../../profesor/profesor.entity/profesor.entity';
import { AlumnoSlot } from '../../profesor/profesor.entity/alumno-slot.entity';
import { Alumno } from '../../alumno/alumno.entity/alumno.entity';
import { Rol } from '../../roles/rol.entity/rol.entity';
import { MovimientoHelper } from '../../../common/helpers/movimiento.helper';
import { AccionMovimiento } from '../../movimiento/enums/movimiento.enums';
import { Ubicacion } from '../../ubicacion/ubicacion.entity/ubicacion.entity';
import { UpdateMisUbicacionesDto } from '../dto/update-mis-ubicaciones.dto';

/**
 * Servicio encargado de la lógica de negocio para la gestión de usuarios.
 * Administra el ciclo de vida de los usuarios, la gestión de roles,
 * y la personalización granular de permisos (adiciones y exclusiones).
 */
@Injectable()
export class UsuarioService {
  /**
   * Crea una instancia de UsuarioService.
   * @param usuarioRepo Repositorio especializado para usuarios.
   * @param dataSource Fuente de datos para la gestión de transacciones.
   * @param permisoRepo Repositorio para la entidad de permisos técnicos.
   * @param authPermissionsService Servicio para el cálculo y gestión de caché de permisos.
   * @param ubicacionRepo Repositorio para validar ubicaciones asignadas.
   */
  constructor(
    private readonly usuarioRepo: UsuarioRepository,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(Permiso)
    private readonly permisoRepo: Repository<Permiso>,
    @InjectRepository(Ubicacion)
    private readonly ubicacionRepo: Repository<Ubicacion>,
    private readonly authPermissionsService: AuthPermissionsService,
    private readonly movimientoHelper: MovimientoHelper
  ) {}

  /**
   * Valida que la ubicación exista cuando se envía en el DTO.
   */
  private async assertUbicacionExistsIfProvided(
    ubicacionId?: string | null
  ): Promise<void> {
    if (ubicacionId === undefined || ubicacionId === null) {
      return;
    }
    const ubicacion = await this.ubicacionRepo.findOne({
      where: { id: ubicacionId },
    });
    if (!ubicacion) {
      throw new NotFoundException(I18nHelper.getError('LOCATION_NOT_FOUND'));
    }
  }

  private async resolveUbicaciones(
    ubicacionesIds?: string[] | null,
    ubicacionId?: string | null
  ): Promise<Ubicacion[] | undefined> {
    if (!Array.isArray(ubicacionesIds)) {
      return undefined;
    }

    const uniqueIds = Array.from(
      new Set(
        [...ubicacionesIds, ...(ubicacionId ? [ubicacionId] : [])].filter(
          (id): id is string => typeof id === 'string' && id.trim().length > 0
        )
      )
    );

    if (uniqueIds.length === 0) {
      return [];
    }

    const ubicaciones = await this.ubicacionRepo.findBy({ id: In(uniqueIds) });
    if (ubicaciones.length !== uniqueIds.length) {
      throw new NotFoundException(I18nHelper.getError('LOCATION_NOT_FOUND'));
    }

    return ubicaciones;
  }

  /**
   * Crea un usuario básico con estado activo por defecto.
   * @param dto Datos del nuevo usuario.
   * @returns El usuario creado.
   */
  async create(dto: CreateUsuarioDto) {
    const { ubicacionesIds, ...dtoWithoutUbicacionesIds } = dto;
    await this.assertUbicacionExistsIfProvided(dto.ubicacionId);
    const ubicaciones = await this.resolveUbicaciones(
      ubicacionesIds,
      dto.ubicacionId
    );
    const created = await this.usuarioRepo.createUsuario({
      ...dtoWithoutUbicacionesIds,
      ubicaciones,
      ubicacionId:
        dto.ubicacionId ??
        (Array.isArray(ubicacionesIds) && ubicacionesIds.length > 0
          ? ubicacionesIds[0]
          : undefined),
      activo: true,
    });

    await this.movimientoHelper.log({
      userId: created.id,
      entidad: 'Usuario',
      entidadId: created.id,
      accion: AccionMovimiento.CREATE,
      descripcion: `Creación de usuario ${created.id}`,
      after: created,
    });

    return created;
  }

  /**
   * Crea un usuario con lógica administrativa extendida dentro de una transacción.
   * Gestiona automáticamente la creación de entidades vinculadas como Profesor o Alumno.
   * @param dto Datos extendidos de creación.
   * @returns El usuario completo creado.
   */
  async createAdmin(dto: AdminCreateUsuarioDto) {
    await this.assertUbicacionExistsIfProvided(dto.ubicacionId);
    const { ubicacionesIds, ...dtoWithoutUbicacionesIds } = dto;
    const ubicaciones = await this.resolveUbicaciones(
      ubicacionesIds,
      dto.ubicacionId
    );
    const savedUserId = await this.dataSource.transaction(async (manager) => {
      const { aula, cial, ...userData } = dtoWithoutUbicacionesIds;
      const systemRole = await manager.findOne(Rol, {
        where: { nombre: dto.rol },
      });

      const usuario = manager.create(Usuario, {
        ...userData,
        ubicacionId:
          dto.ubicacionId ??
          (Array.isArray(ubicacionesIds) && ubicacionesIds.length > 0
            ? ubicacionesIds[0]
            : null),
        status: UserStatus.ACTIVE,
        activo: true,
        roles: systemRole ? [systemRole] : [],
      });

      const savedUser = await manager.save(usuario);

      if (ubicaciones !== undefined) {
        await this.usuarioRepo.syncUsuarioUbicaciones(
          savedUser.id,
          ubicaciones,
          savedUser.ubicacionId ?? null,
          manager
        );
      }

      if (dto.rol === rolUsuario.PROFESOR) {
        const profesor = manager.create(Profesor, {
          user: savedUser,
          cial: cial || `CIAL-${Date.now()}`,
        });
        await manager.save(profesor);
      } else if (dto.rol === rolUsuario.ALUMNO) {
        const alumno = manager.create(Alumno, {
          user: savedUser,
        });

        if (aula) {
          const slot = await manager.findOne(AlumnoSlot, {
            where: { aula },
            relations: ['profesor'],
          });
          if (slot) {
            alumno.slot = slot;
            alumno.profesor = slot.profesor;
          }
        }
        await manager.save(alumno);
      }

      return savedUser.id;
    });

    const created = await this.findOne(savedUserId);
    await this.movimientoHelper.log({
      userId: created.id,
      entidad: 'Usuario',
      entidadId: created.id,
      accion: AccionMovimiento.CREATE,
      descripcion: `Creación administrativa de usuario ${created.id}`,
      after: created,
    });

    return created;
  }

  /**
   * Lista usuarios con soporte para paginación y filtros por rol.
   * @param query Parámetros de consulta.
   * @param userRole Rol del usuario solicitante para filtrado de seguridad.
   * @returns Lista paginada de usuarios.
   */
  findAll(query: PaginationQueryDto, userRole?: string) {
    return this.usuarioRepo.findAll(query, userRole);
  }

  /**
   * Obtiene una lista simplificada de usuarios activos.
   * @returns Lista de usuarios (ID, username).
   */
  /**
   * Expone "findAllMinimal" en smart-economat-backend (Nest).
   * @undefined {Promise<Usuario[]>} Datos efectivos después de ejecutar la operación.
   */
  findAllMinimal() {
    return this.usuarioRepo.findAllMinimal();
  }

  /**
   * Busca un usuario por su UUID.
   * @param id UUID del usuario.
   * @returns El usuario encontrado.
   * @throws NotFoundException Si el usuario no existe.
   */
  async findOne(id: string) {
    const usuario = await this.usuarioRepo.findById(id);
    if (!usuario) {
      throw new NotFoundException(I18nHelper.getError('USER_NOT_FOUND'));
    }
    return usuario;
  }

  /**
   * Actualiza los datos de un usuario.
   * @param id UUID del usuario.
   * @param dto Parcial con los datos a actualizar.
   * @returns El usuario actualizado.
   */
  async update(id: string, dto: Partial<Usuario>) {
    const dtoWithUbicaciones = dto as Partial<Usuario> & {
      ubicacionesIds?: string[];
    };
    const { ubicacionesIds, ...dtoWithoutUbicacionesIds } = dtoWithUbicaciones;
    await this.assertUbicacionExistsIfProvided(dto.ubicacionId);
    const ubicaciones = await this.resolveUbicaciones(
      ubicacionesIds,
      dto.ubicacionId
    );
    const before = await this.findOne(id);
    const after = await this.usuarioRepo.updateUsuario(id, {
      ...dtoWithoutUbicacionesIds,
      ubicaciones,
      ubicacionId:
        dto.ubicacionId ??
        (Array.isArray(ubicacionesIds) && ubicacionesIds.length > 0
          ? ubicacionesIds[0]
          : ubicacionesIds
            ? null
            : undefined),
    });

    await this.movimientoHelper.log({
      userId: id,
      entidad: 'Usuario',
      entidadId: id,
      accion: AccionMovimiento.UPDATE,
      descripcion: `Actualización de usuario ${id}`,
      before,
      after,
    });

    return after;
  }

  /**
   * Actualiza las preferencias del usuario.
   * @param id UUID del usuario.
   * @param preferences Objeto de preferencias.
   * @returns El usuario actualizado.
   */
  async updatePreferences(id: string, preferences: Record<string, any>) {
    const usuario = await this.findOne(id);
    const updatedPreferences = {
      ...(usuario.preferences || {}),
      ...preferences,
    };
    const updated = await this.usuarioRepo.updateUsuario(id, {
      preferences: updatedPreferences,
    });

    await this.movimientoHelper.log({
      userId: id,
      entidad: 'Usuario',
      entidadId: id,
      accion: AccionMovimiento.CONFIG_CHANGE,
      descripcion: `Cambio de preferencias de usuario ${id}`,
      before: { preferences: usuario.preferences || {} },
      after: { preferences: updated?.preferences || {} },
    });

    return updated;
  }

  /**
   * Actualización administrativa que permite modificar campos protegidos.
   * @param id UUID del usuario.
   * @param dto Datos administrativos.
   * @returns El usuario actualizado.
   */
  async updateAdmin(id: string, dto: AdminUpdateUsuarioDto) {
    const { ubicacionesIds, ...dtoWithoutUbicacionesIds } = dto;
    await this.assertUbicacionExistsIfProvided(dto.ubicacionId);
    const ubicaciones = await this.resolveUbicaciones(
      ubicacionesIds,
      dto.ubicacionId
    );
    const usuario = await this.findOne(id);
    if (!usuario) {
      throw new NotFoundException(I18nHelper.getError('USER_NOT_FOUND'));
    }

    const updated = await this.usuarioRepo.updateUsuario(id, {
      ...dtoWithoutUbicacionesIds,
      ubicaciones,
      ubicacionId:
        dto.ubicacionId ??
        (Array.isArray(ubicacionesIds) && ubicacionesIds.length > 0
          ? ubicacionesIds[0]
          : ubicacionesIds
            ? null
            : undefined),
    });

    await this.movimientoHelper.log({
      userId: id,
      entidad: 'Usuario',
      entidadId: id,
      accion: AccionMovimiento.UPDATE,
      descripcion: `Actualización administrativa de usuario ${id}`,
      before: usuario,
      after: updated,
    });

    return updated;
  }

  /**
   * Cambia la contraseña de un usuario validando su contraseña actual.
   * @param userId UUID del usuario.
   * @param dto Contraseña antigua y nueva.
   * @returns Resultado del cambio.
   * @throws UnauthorizedException Si la contraseña antigua es incorrecta.
   */
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const usuario = await this.usuarioRepo.findByIdWithPassword(userId);
    if (!usuario) throw new NotFoundException();

    const isMatch = await bcrypt.compare(dto.oldPassword, usuario.password);
    if (!isMatch) {
      throw new UnauthorizedException(
        I18nHelper.getError('INVALID_OLD_PASSWORD')
      );
    }

    const updated = await this.usuarioRepo.updateUsuario(userId, {
      password: dto.newPassword,
    });

    await this.movimientoHelper.log({
      userId,
      entidad: 'Usuario',
      entidadId: userId,
      accion: AccionMovimiento.CONFIG_CHANGE,
      descripcion: `Cambio de contraseña de usuario ${userId}`,
    });

    return updated;
  }

  /**
   * Restablece la contraseña de un usuario y le obliga a cambiarla en el siguiente inicio de sesión.
   * @param id UUID del usuario.
   * @param dto Nueva contraseña temporal.
   * @returns Resultado del reseteo.
   */
  async resetPassword(id: string, dto: ResetPasswordDto) {
    const usuario = await this.findOne(id);

    if (usuario.status === UserStatus.BLOCKED) {
      throw new BadRequestException(
        I18nHelper.getError('USER_BLOCKED_CANNOT_RESET_PASSWORD')
      );
    }

    const updated = await this.usuarioRepo.updateUsuario(id, {
      password: dto.password,
      mustChangePassword: true,
    });

    await this.movimientoHelper.log({
      userId: id,
      entidad: 'Usuario',
      entidadId: id,
      accion: AccionMovimiento.CONFIG_CHANGE,
      descripcion: `Reset de contraseña de usuario ${id}`,
      before: { mustChangePassword: usuario.mustChangePassword },
      after: { mustChangePassword: true },
    });

    return updated;
  }

  /**
   * Elimina un usuario del sistema.
   * @param id UUID del usuario.
   */
  /**
   * Expone "remove" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
   */
  async remove(id: string) {
    const before = await this.findOne(id);
    await this.usuarioRepo.deleteUsuario(id);

    await this.movimientoHelper.log({
      userId: id,
      entidad: 'Usuario',
      entidadId: id,
      accion: AccionMovimiento.DELETE,
      descripcion: `Eliminación de usuario ${id}`,
      before,
    });
  }

  /**
   * Asocia un permiso individual al usuario e invalida su caché de permisos.
   * @param userId UUID del usuario.
   * @param permisoId UUID del permiso.
   * @returns El usuario con la nueva lista de permisos adicionales.
   */
  async addAdditionalPermission(userId: string, permisoId: string) {
    const usuario = await this.usuarioRepo.findById(userId);
    if (!usuario) throw new NotFoundException();

    const permiso = await this.permisoRepo.findOneBy({ id: permisoId });
    if (!permiso)
      throw new NotFoundException(I18nHelper.getError('PERMISO_NO_ENCONTRADO'));

    const basicUser = await this.usuarioRepo.repo.findOne({
      where: { id: userId },
      relations: ['permisosAdicionales'],
    });

    if (!basicUser!.permisosAdicionales.find((p) => p.id === permisoId)) {
      basicUser!.permisosAdicionales.push(permiso);
      await this.usuarioRepo.repo.save(basicUser!);
      await this.authPermissionsService.invalidateUserCache(userId);

      await this.movimientoHelper.log({
        userId,
        entidad: 'Usuario',
        entidadId: userId,
        accion: AccionMovimiento.CONFIG_CHANGE,
        descripcion: `Asignación de permiso adicional ${permisoId} a usuario ${userId}`,
      });
    }
    return this.findOne(userId);
  }

  /**
   * Elimina un permiso adicional e invalida la caché.
   * @param userId UUID del usuario.
   * @param permisoId UUID del permiso.
   * @returns El usuario actualizado.
   */
  async removeAdditionalPermission(userId: string, permisoId: string) {
    const basicUser = await this.usuarioRepo.repo.findOne({
      where: { id: userId },
      relations: ['permisosAdicionales'],
    });
    if (!basicUser) throw new NotFoundException();

    basicUser.permisosAdicionales = basicUser.permisosAdicionales.filter(
      (p) => p.id !== permisoId
    );
    await this.usuarioRepo.repo.save(basicUser);
    await this.authPermissionsService.invalidateUserCache(userId);

    await this.movimientoHelper.log({
      userId,
      entidad: 'Usuario',
      entidadId: userId,
      accion: AccionMovimiento.CONFIG_CHANGE,
      descripcion: `Revocación de permiso adicional ${permisoId} a usuario ${userId}`,
    });

    return this.findOne(userId);
  }

  /**
   * Añade un permiso a la lista de exclusiones para este usuario.
   * @param userId UUID del usuario.
   * @param permisoId UUID del permiso a excluir.
   * @returns El usuario con la nueva lista de exclusiones.
   */
  async addExcludedPermission(userId: string, permisoId: string) {
    const usuario = await this.usuarioRepo.findById(userId);
    if (!usuario) throw new NotFoundException();

    const permiso = await this.permisoRepo.findOneBy({ id: permisoId });
    if (!permiso)
      throw new NotFoundException(I18nHelper.getError('PERMISO_NO_ENCONTRADO'));

    const basicUser = await this.usuarioRepo.repo.findOne({
      where: { id: userId },
      relations: ['permisosExcluidos'],
    });

    if (!basicUser!.permisosExcluidos.find((p) => p.id === permisoId)) {
      basicUser!.permisosExcluidos.push(permiso);
      await this.usuarioRepo.repo.save(basicUser!);
      await this.authPermissionsService.invalidateUserCache(userId);

      await this.movimientoHelper.log({
        userId,
        entidad: 'Usuario',
        entidadId: userId,
        accion: AccionMovimiento.CONFIG_CHANGE,
        descripcion: `Exclusión de permiso ${permisoId} para usuario ${userId}`,
      });
    }
    return this.findOne(userId);
  }

  /**
   * Elimina un permiso de la lista de exclusiones.
   * @param userId UUID del usuario.
   * @param permisoId UUID del permiso.
   * @returns Éxito de la operación.
   */
  async removeExcludedPermission(userId: string, permisoId: string) {
    const basicUser = await this.usuarioRepo.repo.findOne({
      where: { id: userId },
      relations: ['permisosExcluidos'],
    });
    if (!basicUser) throw new NotFoundException();

    basicUser.permisosExcluidos = (basicUser.permisosExcluidos || []).filter(
      (p) => p.id !== permisoId
    );
    await this.usuarioRepo.repo.save(basicUser);
    await this.authPermissionsService.invalidateUserCache(userId);

    await this.movimientoHelper.log({
      userId,
      entidad: 'Usuario',
      entidadId: userId,
      accion: AccionMovimiento.CONFIG_CHANGE,
      descripcion: `Eliminación de exclusión de permiso ${permisoId} para usuario ${userId}`,
    });

    return { success: true };
  }

  /**
   * Obtiene la lista definitiva de códigos de permiso que el usuario posee efectivamente.
   * @param userId UUID del usuario.
   * @returns Array de códigos de permiso.
   */
  async getUserPermissions(userId: string): Promise<string[]> {
    return this.authPermissionsService.getUserPermissions(userId);
  }

  /**
   * Catálogo mínimo de ubicaciones para que el usuario elija vínculos (sin requerir `ubicaciones:listar`).
   */
  async findCatalogoUbicacionesParaEnlaces(): Promise<
    Array<{ id: string; nombre: string }>
  > {
    const rows = await this.ubicacionRepo.find({
      select: ['id', 'nombre'],
      order: { nombre: 'ASC' },
    });
    return rows.map((r) => ({ id: r.id, nombre: r.nombre }));
  }

  /**
   * Autoservicio: sustituye los vínculos usuario↔ubicación (misma ubicación puede compartirse).
   */
  async updateMisUbicaciones(
    userId: string,
    dto: UpdateMisUbicacionesDto
  ): Promise<Usuario> {
    if (
      dto.ubicacionPredeterminadaId &&
      !dto.ubicacionesIds.includes(dto.ubicacionPredeterminadaId)
    ) {
      throw new BadRequestException(I18nHelper.getError('INVALID_DATA'));
    }

    const ubicaciones = await this.resolveUbicaciones(dto.ubicacionesIds, null);

    let ubicacionOperativaId: string | null = null;
    if (dto.ubicacionesIds.length > 0) {
      if (
        dto.ubicacionPredeterminadaId &&
        dto.ubicacionesIds.includes(dto.ubicacionPredeterminadaId)
      ) {
        ubicacionOperativaId = dto.ubicacionPredeterminadaId;
      } else {
        ubicacionOperativaId = dto.ubicacionesIds[0]!;
      }
    }

    const before = await this.findOne(userId);
    const after = await this.usuarioRepo.updateUsuario(userId, {
      ubicaciones,
      ubicacionId: ubicacionOperativaId,
    });

    await this.movimientoHelper.log({
      userId,
      entidad: 'Usuario',
      entidadId: userId,
      accion: AccionMovimiento.UPDATE,
      descripcion: `Actualización de ubicaciones de trabajo (autoservicio) ${userId}`,
      before: {
        ubicacionId: before.ubicacionId,
        ubicacionesIds: before.ubicaciones?.map((u) => u.id),
      },
      after: {
        ubicacionId: after?.ubicacionId,
        ubicacionesIds: after?.ubicaciones?.map((u) => u.id),
      },
    });

    return this.findOne(userId);
  }
}

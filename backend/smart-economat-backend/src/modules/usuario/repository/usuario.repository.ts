import { Injectable } from '@nestjs/common';
import {
  DataSource,
  EntityManager,
  FindOptionsWhere,
  ILike,
  Repository,
} from 'typeorm';
import { Usuario } from '../usuario.entity/usuario.entity';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { buildFindManyOptions } from '../../../common/utils/typeorm-query.helper';
import { Rol } from '../../roles/rol.entity/rol.entity';
import { UserStatus, rolUsuario } from '../enums/usuario.enums';
import { Profesor } from '../../profesor/profesor.entity/profesor.entity';
import { Alumno } from '../../alumno/alumno.entity/alumno.entity';
import { isSherlockElevatedRole } from '../../sherlock-auth/utils/access.utils';
import { SYSTEM_ROLES } from '../../../common/constants/system-roles.constants';
import { UsuarioUbicacion } from '../usuario-ubicacion.entity/usuario-ubicacion.entity';
import { Ubicacion } from '../../ubicacion/ubicacion.entity/ubicacion.entity';

/** Clase pública (UsuarioRepository). Paquete: smart-economat-backend (Nest). */
@Injectable()
/**
 * Repositorio para operaciones de persistencia de usuario.
 */
export class UsuarioRepository {
  /**
   * Construye la instancia configurada.
   * @undefined {Repository<Usuario>} repo - Entrada efectiva esperada por el contrato.
   * @undefined {Repository<Rol>} rolRepo - Entrada efectiva esperada por el contrato.
   * @undefined {DataSource} dataSource - Entrada efectiva esperada por el contrato.
   */
  constructor(
    @InjectRepository(Usuario)
    public readonly repo: Repository<Usuario>,
    @InjectRepository(Rol)
    private readonly rolRepo: Repository<Rol>,
    @InjectDataSource()
    private readonly dataSource: DataSource
  ) {}

  /**
   * Persiste el pivot usuario↔ubicaciones (acceso granular, no ownership).
   * `undefined` = no tocar; `[]` = borrar vínculos declarados.
   */
  async syncUsuarioUbicaciones(
    usuarioId: string,
    ubicacionesList: Ubicacion[] | undefined,
    ubicacionOperativaId: string | null | undefined,
    manager?: EntityManager
  ): Promise<void> {
    if (ubicacionesList === undefined) return;
    const m = manager ?? this.dataSource.manager;
    await m.delete(UsuarioUbicacion, { usuarioId });
    if (ubicacionesList.length === 0) {
      return;
    }

    const repo = m.getRepository(UsuarioUbicacion);
    const rows = ubicacionesList.map((ub) =>
      repo.create({
        usuarioId,
        ubicacionId: ub.id,
        puedeConsultar: true,
        puedeTransferir: true,
        esUbicacionPredeterminada: ubicacionOperativaId
          ? ub.id === ubicacionOperativaId
          : false,
      })
    );
    await repo.save(rows);
  }

  /**
   * Resuelve roles for user role a partir del contexto disponible.
   *
   * @param role Parámetro de entrada para la operación. Opcional.
   */
  private async resolveRolesForUserRole(role?: Usuario['rol']) {
    if (!role) return undefined;

    const systemRole = await this.rolRepo.findOne({ where: { nombre: role } });
    return systemRole ? [systemRole] : [];
  }

  /**
   * Crea usuario.
   *
   * @param data Parámetro de entrada para la operación.
   */
  /**
   * Crea recursos nuevos en base a las reglas de negocio.
   * @undefined {Partial<Usuario>} data - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<Usuario>} Datos efectivos después de ejecutar la operación.
   */
  async createUsuario(data: Partial<Usuario> & { ubicaciones?: Ubicacion[] }) {
    const { ubicaciones: pivotUbicaciones, ...rest } = data;

    if (rest.status !== undefined && rest.activo === undefined) {
      rest.activo = rest.status === UserStatus.ACTIVE;
    }

    if (rest.rol !== undefined && rest.roles === undefined) {
      rest.roles = await this.resolveRolesForUserRole(rest.rol);
    }

    const saved = await this.repo.save(this.repo.create(rest));

    await this.syncUsuarioUbicaciones(
      saved.id,
      pivotUbicaciones,
      saved.ubicacionId ?? null
    );

    return (await this.findById(saved.id)) ?? saved;
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  private resolveStatusFilter(
    estado?: string
  ): Pick<Usuario, 'status' | 'activo'> | null {
    if (!estado) {
      return null;
    }

    const normalized = estado.trim().toUpperCase();

    if (normalized === 'ACTIVO' || normalized === 'ACTIVE') {
      return { status: UserStatus.ACTIVE, activo: true };
    }

    if (normalized === 'INACTIVO' || normalized === 'INACTIVE') {
      return { status: UserStatus.INACTIVE, activo: false };
    }

    if (normalized === 'BLOQUEADO' || normalized === 'BLOCKED') {
      return { status: UserStatus.BLOCKED, activo: false };
    }

    return null;
  }

  /**
   * Busca all.
   *
   * @param query Parámetro de entrada para la operación.
   * @param userRole Parámetro de entrada para la operación. Opcional.
   */
  /**
   * Expone "findAll" en smart-economat-backend (Nest).
   * @undefined {PaginationQueryDto} query - Entrada efectiva esperada por el contrato.
   * @undefined {string | undefined} userRole - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<PaginatedResponseDto<Usuario>>} Datos efectivos después de ejecutar la operación.
   */
  findAll(query: PaginationQueryDto, userRole?: string) {
    const page = query.page ?? 1;
    const paginationOptions = buildFindManyOptions<Usuario>(query, 'username');
    const limit = paginationOptions.take ?? query.limit ?? 20;

    let where: FindOptionsWhere<Usuario> | FindOptionsWhere<Usuario>[] = {};
    if (query.rol) {
      const normalized = query.rol.toUpperCase();
      let backendRol: rolUsuario;

      if (normalized === SYSTEM_ROLES.SUPER_ADMIN) {
        backendRol = rolUsuario.SUPER_ADMIN;
      } else if (normalized === SYSTEM_ROLES.ADMIN) {
        backendRol = rolUsuario.ADMIN;
      } else if (normalized === SYSTEM_ROLES.PROFESOR) {
        backendRol = rolUsuario.PROFESOR;
      } else if (normalized === SYSTEM_ROLES.ALUMNO) {
        backendRol = rolUsuario.ALUMNO;
      } else {
        backendRol = query.rol as rolUsuario;
      }
      if (query.searchTerm) {
        const term = ILike(`%${query.searchTerm}%`);
        where = [
          { username: term, rol: backendRol },
          { email: term, rol: backendRol },
          { nombre: term, rol: backendRol },
        ];
      } else {
        where = { rol: backendRol };
      }
    } else if (query.searchTerm) {
      const term = ILike(`%${query.searchTerm}%`);
      where = [{ username: term }, { email: term }, { nombre: term }];
    }

    const statusFilter = this.resolveStatusFilter(query.estado);

    if (statusFilter) {
      if (Array.isArray(where)) {
        where = where.map((condition) => ({ ...condition, ...statusFilter }));
      } else {
        where = { ...where, ...statusFilter };
      }
    }

    const isAdmin = isSherlockElevatedRole(userRole);

    if (!isAdmin) {
      if (Array.isArray(where)) {
        where = where.map((w) => ({ ...w, activo: true }));
      } else {
        where.activo = true;
      }
    }

    return this.repo
      .findAndCount({
        relations: [
          'ubicacion',
          'usuarioUbicaciones',
          'usuarioUbicaciones.ubicacion',
          'roles',
          'alumno',
          'alumno.slot',
          'alumno.profesor',
          'alumno.profesor.user',
        ],
        ...paginationOptions,
        where,
      })
      .then(([data, total]) => {
        return {
          data,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        } as unknown as PaginatedResponseDto<Usuario>;
      });
  }

  /**
   * Busca by id.
   *
   * @param id Parámetro de entrada para la operación.
   */
  /**
   * Expone "findById" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<Usuario | null>} Datos efectivos después de ejecutar la operación.
   */
  findById(id: string) {
    return this.repo.findOne({
      where: { id },
      relations: [
        'ubicacion',
        'usuarioUbicaciones',
        'usuarioUbicaciones.ubicacion',
        'roles',
        'profesor',
        'profesor.slots',
        'permisosAdicionales',
        'permisosExcluidos',
        'alumno',
        'alumno.slot',
        'alumno.profesor',
        'alumno.profesor.user',
      ],
    });
  }

  /**
   * Busca all minimal.
   */
  /**
   * Expone "findAllMinimal" en smart-economat-backend (Nest).
   * @undefined {Promise<Usuario[]>} Datos efectivos después de ejecutar la operación.
   */
  findAllMinimal() {
    return this.repo
      .createQueryBuilder('usuario')
      .select([
        'usuario.id',
        'usuario.username',
        'usuario.nombre',
        'usuario.email',
        'usuario.rol',
      ])
      .where('usuario.activo = :activo', { activo: true })
      .orderBy('usuario.username', 'ASC')
      .getMany();
  }

  /**
   * Busca by id with password.
   *
   * @param id Parámetro de entrada para la operación.
   */
  /**
   * Expone "findByIdWithPassword" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<Usuario | null>} Datos efectivos después de ejecutar la operación.
   */
  findByIdWithPassword(id: string) {
    return this.repo
      .createQueryBuilder('usuario')
      .addSelect('usuario.password')
      .where('usuario.id = :id', { id })
      .getOne();
  }

  /**
   * Actualiza usuario.
   *
   * @param id Parámetro de entrada para la operación.
   * @param data Parámetro de entrada para la operación.
   */
  /**
   * Persiste modificaciones válidas sobre entidades existentes.
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {Partial<Usuario>} data - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<Usuario | null>} Datos efectivos después de ejecutar la operación.
   */
  async updateUsuario(
    id: string,
    data: Partial<Usuario> & { ubicaciones?: Ubicacion[] }
  ) {
    const { ubicaciones: pivotUbicaciones, ...rest } = data;
    const usuario = await this.findById(id);
    if (!usuario) return null;

    if (rest.status !== undefined && rest.activo === undefined) {
      rest.activo = rest.status === UserStatus.ACTIVE;
    }

    if (rest.activo !== undefined && rest.status === undefined) {
      rest.status = rest.activo ? UserStatus.ACTIVE : UserStatus.INACTIVE;
    }

    if (rest.status !== undefined && rest.activo !== undefined) {
      if (
        (rest.status === UserStatus.ACTIVE && !rest.activo) ||
        (rest.status !== UserStatus.ACTIVE && rest.activo)
      ) {
        rest.activo = rest.status === UserStatus.ACTIVE;
      }
    }

    if (rest.rol !== undefined && rest.roles === undefined) {
      rest.roles = await this.resolveRolesForUserRole(rest.rol);
    }

    Object.assign(usuario, rest);

    /*Si se está limpiando explícitamente el ubicacionId, debemos anular también
    la relación cargada para que TypeORM no restaure el ID basándose en el objeto*/
    if (rest.ubicacionId === null) {
      usuario.ubicacion = null as any;
    } else if (
      rest.ubicacionId !== undefined &&
      usuario.ubicacion?.id !== rest.ubicacionId
    ) {
      usuario.ubicacion = { id: rest.ubicacionId } as Ubicacion;
    }

    await this.repo.save(usuario);

    if (pivotUbicaciones !== undefined) {
      await this.syncUsuarioUbicaciones(
        id,
        pivotUbicaciones,
        usuario.ubicacionId ?? null
      );
    }

    return this.findById(id);
  }

  /**
   * Elimina usuario.
   *
   * @param id Parámetro de entrada para la operación.
   */
  /**
   * Elimina o marca entidades siguendo las políticas configuradas.
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<{ id: string; deleted: boolean; } | null>} Datos efectivos después de ejecutar la operación.
   */
  async deleteUsuario(id: string) {
    const usuario = await this.findById(id);
    if (!usuario) return null;

    if (usuario.profesor) {
      await this.dataSource
        .getRepository(Profesor)
        .softRemove(usuario.profesor);
    }
    if (usuario.alumno) {
      await this.dataSource.getRepository(Alumno).softRemove(usuario.alumno);
    }

    await this.repo.softDelete(id);

    return { id, deleted: true };
  }
}

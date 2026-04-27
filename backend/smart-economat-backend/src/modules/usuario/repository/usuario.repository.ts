import { Injectable } from '@nestjs/common';
import { DataSource, FindOptionsWhere, ILike, Repository } from 'typeorm';
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

@Injectable()
/**
 * Documentación en español.
 */
export class UsuarioRepository {
  constructor(
    @InjectRepository(Usuario)
    public readonly repo: Repository<Usuario>,
    @InjectRepository(Rol)
    private readonly rolRepo: Repository<Rol>,
    @InjectDataSource()
    private readonly dataSource: DataSource
  ) {}

  /**
   * Documentación en español.
   */
  private async resolveRolesForUserRole(role?: Usuario['rol']) {
    if (!role) return undefined;

    const systemRole = await this.rolRepo.findOne({ where: { nombre: role } });
    return systemRole ? [systemRole] : [];
  }

  /**
   * Documentación en español.
   */
  async createUsuario(data: Partial<Usuario>) {
    if (data.status !== undefined && data.activo === undefined) {
      data.activo = data.status === UserStatus.ACTIVE;
    }

    if (data.rol !== undefined && data.roles === undefined) {
      data.roles = await this.resolveRolesForUserRole(data.rol);
    }

    return this.repo.save(this.repo.create(data));
  }

  /**
   * Documentación en español.
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
   * Documentación en español.
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
   * Documentación en español.
   */
  findById(id: string) {
    return this.repo.findOne({
      where: { id },
      relations: [
        'roles',
        'profesor',
        'profesor.slots',
        'profesor.slots.ubicacion',
        'permisosAdicionales',
        'permisosExcluidos',
        'alumno',
        'alumno.slot',
        'alumno.slot.ubicacion',
        'alumno.profesor',
        'alumno.profesor.user',
      ],
    });
  }

  /**
   * Documentación en español.
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
   * Documentación en español.
   */
  findByIdWithPassword(id: string) {
    return this.repo
      .createQueryBuilder('usuario')
      .addSelect('usuario.password')
      .where('usuario.id = :id', { id })
      .getOne();
  }

  /**
   * Documentación en español.
   */
  async updateUsuario(id: string, data: Partial<Usuario>) {
    const usuario = await this.findById(id);
    if (!usuario) return null;

    if (data.status !== undefined && data.activo === undefined) {
      data.activo = data.status === UserStatus.ACTIVE;
    }

    if (data.activo !== undefined && data.status === undefined) {
      data.status = data.activo ? UserStatus.ACTIVE : UserStatus.INACTIVE;
    }

    if (data.status !== undefined && data.activo !== undefined) {
      if (
        (data.status === UserStatus.ACTIVE && !data.activo) ||
        (data.status !== UserStatus.ACTIVE && data.activo)
      ) {
        data.activo = data.status === UserStatus.ACTIVE;
      }
    }

    if (data.rol !== undefined && data.roles === undefined) {
      data.roles = await this.resolveRolesForUserRole(data.rol);
    }

    Object.assign(usuario, data);
    await this.repo.save(usuario);

    return this.findById(id);
  }

  /**
   * Documentación en español.
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

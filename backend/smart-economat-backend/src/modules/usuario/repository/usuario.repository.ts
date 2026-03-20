import { Injectable } from '@nestjs/common';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { Usuario } from '../usuario.entity/usuario.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { buildFindManyOptions } from '../../../common/utils/typeorm-query.helper';
import { Rol } from '../../roles/rol.entity/rol.entity';
import { UserStatus, rolUsuario } from '../enums/usuario.enums';

@Injectable()
export class UsuarioRepository {
  constructor(
    @InjectRepository(Usuario)
    public readonly repo: Repository<Usuario>,
    @InjectRepository(Rol)
    private readonly rolRepo: Repository<Rol>
  ) {}

  private async resolveRolesForUserRole(role?: Usuario['rol']) {
    if (!role) return undefined;

    const systemRole = await this.rolRepo.findOne({ where: { nombre: role } });
    return systemRole ? [systemRole] : [];
  }

  async createUsuario(data: Partial<Usuario>) {
    if (data.status !== undefined && data.activo === undefined) {
      data.activo = data.status === UserStatus.ACTIVE;
    }

    if (data.rol !== undefined && data.roles === undefined) {
      data.roles = await this.resolveRolesForUserRole(data.rol);
    }

    return this.repo.save(this.repo.create(data));
  }

  findAll(query: PaginationQueryDto, userRole?: string) {
    const page = query.page ?? 1;
    const paginationOptions = buildFindManyOptions<Usuario>(query, 'username');
    const limit = paginationOptions.take ?? query.limit ?? 20;

    let where: FindOptionsWhere<Usuario> | FindOptionsWhere<Usuario>[] = {};
    if (query.rol) {
      const normalized = query.rol.toUpperCase();
      let backendRol: rolUsuario;

      if (normalized === 'ADMINISTRADOR' || normalized === 'ADMIN') {
        backendRol = rolUsuario.ADMINISTRADOR;
      } else if (normalized === 'PROFESOR') {
        backendRol = rolUsuario.PROFESOR;
      } else if (normalized === 'ALUMNO') {
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

    const isAdmin =
      userRole?.toUpperCase() === (rolUsuario.ADMINISTRADOR as string) ||
      userRole?.toUpperCase() === (rolUsuario.SUPER_ADMIN as string) ||
      userRole?.toUpperCase() === 'ADMIN';

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
          'movimientos',
          'pedidos',
          'recepciones',
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
        const processedData = data.map((usuario) => ({
          ...usuario,
          movimientos: usuario.movimientos || [],
          pedidos: usuario.pedidos || [],
          recepciones: usuario.recepciones || [],
        }));

        return {
          data: processedData,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        } as PaginatedResponseDto<Usuario>;
      });
  }

  findById(id: string) {
    return this.repo.findOne({
      where: { id },
      relations: [
        'movimientos',
        'pedidos',
        'recepciones',
        'roles',
        'alumno',
        'alumno.slot',
        'alumno.profesor',
        'alumno.profesor.user',
      ],
    });
  }

  findByIdWithPassword(id: string) {
    return this.repo
      .createQueryBuilder('usuario')
      .addSelect('usuario.password')
      .where('usuario.id = :id', { id })
      .getOne();
  }

  async updateUsuario(id: string, data: Partial<Usuario>) {
    const usuario = await this.findById(id);
    if (!usuario) return null;

    if (data.status !== undefined && data.activo === undefined) {
      data.activo = data.status === UserStatus.ACTIVE;
    }

    if (data.activo !== undefined && data.status === undefined) {
      data.status = data.activo ? UserStatus.ACTIVE : UserStatus.INACTIVE;
    }

    if (data.rol !== undefined && data.roles === undefined) {
      data.roles = await this.resolveRolesForUserRole(data.rol);
    }

    Object.assign(usuario, data);
    await this.repo.save(usuario);

    return this.findById(id);
  }

  async deleteUsuario(id: string) {
    const usuario = await this.findById(id);
    if (!usuario) return null;

    usuario.activo = false;
    usuario.status = UserStatus.INACTIVE;
    await this.repo.save(usuario);

    return this.findById(id);
  }
}

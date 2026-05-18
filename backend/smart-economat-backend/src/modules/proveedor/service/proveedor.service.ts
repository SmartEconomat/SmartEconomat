import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Proveedor } from '../proveedor.entity/proveedor.entity';
import { ProveedorRepository } from '../repository/proveedor.repository';
import { CreateProveedorDto } from '../dto/create-proveedor.dto';
import { UpdateProveedorDto } from '../dto/update-proveedor.dto';
import { I18nHelper } from '../../../common/helpers/i18n.helper';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';

/**
 * Servicio encargado de la lógica de negocio para la gestión de proveedores.
 * Maneja la validación de unicidad (NIF, nombre), la persistencia y la consulta filtrada.
 */
@Injectable()
export class ProveedorService {
  /**
   * Crea una instancia de ProveedorService.
   * @param proveedorRepository Repositorio para operaciones de base de datos de proveedores.
   */
  constructor(private readonly proveedorRepository: ProveedorRepository) {}

  /**
   * Registra un nuevo proveedor validando que el nombre y el NIF sean únicos.
   * @param createProveedorDto Datos del proveedor a crear.
   * @returns El proveedor guardado.
   * @throws BadRequestException Si el nombre o NIF ya están en uso.
   */
  async create(createProveedorDto: CreateProveedorDto): Promise<Proveedor> {
    const { nombre, nif } = createProveedorDto;

    const existingNombre = await this.proveedorRepository.findOne({
      where: { nombre },
      withDeleted: true,
    });
    if (existingNombre) {
      if (existingNombre.deletedAt) {
        throw new BadRequestException(
          I18nHelper.getError('ENTITY_ALREADY_EXISTS_BUT_DELETED') ||
            'El proveedor existe pero está eliminado. Restáuralo para volver a usarlo.'
        );
      }
      throw new BadRequestException(I18nHelper.getError('DUPLICATE_ENTRY'));
    }

    if (nif) {
      const existingNif = await this.proveedorRepository.findOne({
        where: { nif },
        withDeleted: true,
      });
      if (existingNif) {
        if (existingNif.deletedAt) {
          throw new BadRequestException(
            I18nHelper.getError('ENTITY_ALREADY_EXISTS_BUT_DELETED') ||
              'Un proveedor con este NIF existe pero está eliminado.'
          );
        }
        throw new BadRequestException(I18nHelper.getError('DUPLICATE_ENTRY'));
      }
    }

    const proveedor = this.proveedorRepository.create(createProveedorDto);
    return await this.proveedorRepository.save(proveedor);
  }

  /**
   * Busca proveedores aplicando filtros de búsqueda, paginación y ordenación.
   * @param query DTO con parámetros de paginación y término de búsqueda.
   * @param userRole Rol del usuario (solo administradores pueden listar eliminados).
   * @returns Respuesta paginada con la lista de proveedores.
   */
  async findAll(
    query: PaginationQueryDto,
    userRole?: string
  ): Promise<PaginatedResponseDto<Proveedor>> {
    const isAdmin =
      userRole?.toUpperCase() === 'ADMIN' ||
      userRole?.toUpperCase() === 'SUPER_ADMIN';
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 50);
    const sortBy = query.sortBy ?? 'nombre';
    const order = query.order ?? 'ASC';

    const soloEliminados = query.includeDeleted === true && isAdmin;

    const queryBuilder =
      this.proveedorRepository.createQueryBuilder('proveedor');

    if (soloEliminados) {
      queryBuilder.withDeleted();
    }

    queryBuilder.leftJoinAndSelect('proveedor.productos', 'productos');

    if (soloEliminados) {
      queryBuilder.andWhere('proveedor.deleted_at IS NOT NULL');
    } else {
      queryBuilder.andWhere('proveedor.deleted_at IS NULL');
    }

    if (query.searchTerm) {
      queryBuilder.andWhere(
        '(proveedor.nombre ILIKE :searchTerm OR proveedor.nif ILIKE :searchTerm OR proveedor.contacto ILIKE :searchTerm OR proveedor.email ILIKE :searchTerm)',
        { searchTerm: `%${query.searchTerm}%` }
      );
    }

    queryBuilder
      .orderBy(`proveedor.${sortBy}`, order)
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    const processedData = data.map((proveedor) => ({
      ...proveedor,
      productos: proveedor.productos || [],
    }));

    const totalPages = Math.ceil(total / limit) || 1;
    return { data: processedData, total, page, limit, totalPages };
  }

  /**
   * Obtiene un proveedor por su UUID, cargando sus productos asociados.
   * @param id UUID del proveedor.
   * @param userRole Rol del usuario para control de visibilidad.
   * @returns El proveedor con sus relaciones cargadas.
   * @throws NotFoundException Si el proveedor no existe.
   */
  async findOne(id: string, userRole?: string): Promise<Proveedor> {
    const isAdmin =
      userRole?.toUpperCase() === 'ADMIN' ||
      userRole?.toUpperCase() === 'SUPER_ADMIN';

    const proveedor = await this.proveedorRepository.findOne({
      where: { id },
      withDeleted: true,
      relations: ['productos'],
    });

    if (!proveedor) {
      throw new NotFoundException(I18nHelper.getError('PROVIDER_NOT_FOUND'));
    }

    if (proveedor.deletedAt && !isAdmin) {
      throw new NotFoundException(I18nHelper.getError('PROVIDER_NOT_FOUND'));
    }

    return {
      ...proveedor,
      productos: proveedor.productos || [],
    };
  }

  /**
   * Actualiza la información de un proveedor validando conflictos de unicidad.
   * @param id UUID del proveedor a modificar.
   * @param updateProveedorDto Nuevos datos.
   * @returns El proveedor actualizado.
   */
  async update(
    id: string,
    updateProveedorDto: UpdateProveedorDto
  ): Promise<Proveedor> {
    const proveedor = await this.findOne(id, 'ADMIN');
    const { nombre, nif } = updateProveedorDto;

    if (nombre && nombre !== proveedor.nombre) {
      const existingNombre = await this.proveedorRepository.findOne({
        where: { nombre },
        withDeleted: true,
      });
      if (existingNombre && existingNombre.id !== id) {
        throw new BadRequestException(I18nHelper.getError('DUPLICATE_ENTRY'));
      }
    }

    if (nif && nif !== proveedor.nif) {
      const existingNif = await this.proveedorRepository.findOne({
        where: { nif },
        withDeleted: true,
      });
      if (existingNif && existingNif.id !== id) {
        throw new BadRequestException(I18nHelper.getError('DUPLICATE_ENTRY'));
      }
    }

    this.proveedorRepository.merge(proveedor, updateProveedorDto);
    return await this.proveedorRepository.save(proveedor);
  }

  /**
   * Elimina lógicamente un proveedor.
   * A diferencia de la implementación anterior, permitimos el borrado aunque tenga relaciones
   * ya que el soft delete preserva la integridad referencial histórica.
   * @param id UUID del proveedor a eliminar.
   * @throws NotFoundException Si el proveedor no existe.
   */
  /**
   * Expone "remove" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {string} userId - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
   */
  async remove(id: string, userId: string): Promise<void> {
    const proveedor = await this.proveedorRepository.findOne({
      where: { id },
    });

    if (!proveedor) {
      throw new NotFoundException(I18nHelper.getError('PROVIDER_NOT_FOUND'));
    }

    await this.proveedorRepository.update(id, { deletedBy: userId });
    await this.proveedorRepository.softDelete(id);
  }

  /**
   * Restaura un proveedor previamente eliminado lógicamente.
   * @param id UUID del proveedor a restaurar.
   * @returns El proveedor restaurado.
   * @throws NotFoundException Si el proveedor no existe o no estaba eliminado.
   */
  async restore(id: string, userId: string): Promise<Proveedor> {
    const proveedor = await this.proveedorRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!proveedor || !proveedor.deletedAt) {
      throw new NotFoundException(
        I18nHelper.getError('PROVIDER_NOT_FOUND_OR_NOT_DELETED') ||
          'Proveedor no encontrado o no está en la papelera.'
      );
    }

    await this.proveedorRepository.update(id, {
      deletedAt: null,
      deletedBy: null,
      modifiedBy: userId,
    });
    return await this.findOne(id, 'ADMIN');
  }

  /**
   * Recupera una lista simplificada de proveedores que tienen al menos un pedido.
   * @returns Lista de proveedores con sus IDs y nombres.
   */
  /**
   * Expone "findWithOrders" en smart-economat-backend (Nest).
   * @undefined {Promise<Proveedor[]>} Datos efectivos después de ejecutar la operación.
   */
  async findWithOrders(): Promise<Proveedor[]> {
    return await this.proveedorRepository
      .createQueryBuilder('proveedor')
      .innerJoin('proveedor.pedidos', 'pedido')
      .select(['proveedor.id', 'proveedor.nombre'])
      .where('proveedor.deleted_at IS NULL')
      .distinct(true)
      .orderBy('proveedor.nombre', 'ASC')
      .getMany();
  }
}

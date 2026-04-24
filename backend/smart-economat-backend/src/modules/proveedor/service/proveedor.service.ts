import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ILike } from 'typeorm';
import { Proveedor } from '../proveedor.entity/proveedor.entity';
import { ProveedorRepository } from '../repository/proveedor.repository';
import { CreateProveedorDto } from '../dto/create-proveedor.dto';
import { UpdateProveedorDto } from '../dto/update-proveedor.dto';
import { I18nHelper } from '../../../common/helpers/i18n.helper';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';

/**
 * Service responsible for managing supplier (Proveedor) data, including
 * creation, retrieval, update, and soft-deletion with duplicate-name/NIF guards.
 *
 * @class ProveedorService
 */
@Injectable()
export class ProveedorService {
  /**
   * Creates an instance of ProveedorService.
   *
   * @param {ProveedorRepository} proveedorRepository - Custom repository for the Proveedor entity.
   */
  constructor(private readonly proveedorRepository: ProveedorRepository) {}

  /**
   * Creates a new supplier after verifying that neither the name nor the NIF
   * is already registered in the system.
   *
   * @param {CreateProveedorDto} createProveedorDto - DTO containing supplier creation data.
   * @returns {Promise<Proveedor>} The newly created supplier entity.
   * @throws {BadRequestException} If the name or NIF already exists.
   */
  async create(createProveedorDto: CreateProveedorDto): Promise<Proveedor> {
    const { nombre, nif } = createProveedorDto;

    const existingNombre = await this.proveedorRepository.findOne({
      where: { nombre },
    });
    if (existingNombre) {
      throw new BadRequestException(I18nHelper.getError('DUPLICATE_ENTRY'));
    }

    if (nif) {
      const existingNif = await this.proveedorRepository.findOne({
        where: { nif },
      });
      if (existingNif) {
        throw new BadRequestException(I18nHelper.getError('DUPLICATE_ENTRY'));
      }
    }

    const proveedor = this.proveedorRepository.create(createProveedorDto);
    return await this.proveedorRepository.save(proveedor);
  }

  /**
   * Returns a paginated list of suppliers, supporting full-text search across
   * name, NIF, contact, and email fields. Admin users also receive soft-deleted records.
   *
   * @param {PaginationQueryDto} query - Pagination, sorting, and search parameters.
   * @param {string} [userRole] - Role of the requesting user; admins see deleted records.
   * @returns {Promise<PaginatedResponseDto<Proveedor>>} Paginated supplier list.
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

    const whereCondition = query.searchTerm
      ? [
          { nombre: ILike(`%${query.searchTerm}%`) },
          { nif: ILike(`%${query.searchTerm}%`) },
          { contacto: ILike(`%${query.searchTerm}%`) },
          { email: ILike(`%${query.searchTerm}%`) },
        ]
      : {};

    const [data, total] = await this.proveedorRepository.findAndCount({
      where: whereCondition,
      relations: ['productos'],
      withDeleted: isAdmin,
      order: { [sortBy]: order },
      skip: (page - 1) * limit,
      take: limit,
    });

    const processedData = data.map((proveedor) => ({
      ...proveedor,
      productos: proveedor.productos || [],
    }));

    const totalPages = Math.ceil(total / limit) || 1;
    return { data: processedData, total, page, limit, totalPages };
  }

  /**
   * Retrieves a single supplier by UUID, including its associated products.
   * Admin users can also access soft-deleted suppliers.
   *
   * @param {string} id - UUID of the supplier to retrieve.
   * @param {string} [userRole] - Role of the requesting user; admins see deleted records.
   * @returns {Promise<Proveedor>} The found supplier entity.
   * @throws {NotFoundException} If no supplier with the given ID exists.
   */
  async findOne(id: string, userRole?: string): Promise<Proveedor> {
    const isAdmin =
      userRole?.toUpperCase() === 'ADMIN' ||
      userRole?.toUpperCase() === 'SUPER_ADMIN';

    const proveedor = await this.proveedorRepository.findOne({
      where: { id },
      withDeleted: isAdmin,
      relations: ['productos'],
    });

    if (!proveedor) {
      throw new NotFoundException(I18nHelper.getError('PROVIDER_NOT_FOUND'));
    }

    return {
      ...proveedor,
      productos: proveedor.productos || [],
    };
  }

  /**
   * Updates an existing supplier's fields after checking for name and NIF
   * uniqueness conflicts.
   *
   * @param {string} id - UUID of the supplier to update.
   * @param {UpdateProveedorDto} updateProveedorDto - DTO with the fields to update.
   * @returns {Promise<Proveedor>} The updated supplier entity.
   * @throws {NotFoundException} If the supplier does not exist.
   * @throws {BadRequestException} If the new name or NIF is already in use by another supplier.
   */
  async update(
    id: string,
    updateProveedorDto: UpdateProveedorDto
  ): Promise<Proveedor> {
    const proveedor = await this.findOne(id);
    const { nombre, nif } = updateProveedorDto;

    if (nombre && nombre !== proveedor.nombre) {
      const existingNombre = await this.proveedorRepository.findOne({
        where: { nombre },
      });
      if (existingNombre) {
        throw new BadRequestException(I18nHelper.getError('DUPLICATE_ENTRY'));
      }
    }

    if (nif && nif !== proveedor.nif) {
      const existingNif = await this.proveedorRepository.findOne({
        where: { nif },
      });
      if (existingNif) {
        throw new BadRequestException(I18nHelper.getError('DUPLICATE_ENTRY'));
      }
    }

    this.proveedorRepository.merge(proveedor, updateProveedorDto);
    return await this.proveedorRepository.save(proveedor);
  }

  /**
   * Soft-deletes a supplier after verifying it has no associated products or orders.
   *
   * @param {string} id - UUID of the supplier to remove.
   * @returns {Promise<void>}
   * @throws {NotFoundException} If the supplier does not exist.
   * @throws {BadRequestException} If the supplier has linked products or orders.
   */
  async remove(id: string): Promise<void> {
    const proveedor = await this.proveedorRepository.findOne({
      where: { id },
      relations: ['productos', 'pedidos'],
    });

    if (!proveedor) {
      throw new NotFoundException(I18nHelper.getError('PROVIDER_NOT_FOUND'));
    }

    if (
      (proveedor.productos && proveedor.productos.length > 0) ||
      (proveedor.pedidos && proveedor.pedidos.length > 0)
    ) {
      throw new BadRequestException(
        I18nHelper.getError('ENTITY_HAS_RELATIONS')
      );
    }

    await this.proveedorRepository.softDelete(id);
  }

  /**
   * Returns a deduplicated, alphabetically sorted list of suppliers that have
   * at least one associated purchase order.
   *
   * @returns {Promise<Proveedor[]>} Array of suppliers with at least one order.
   */
  async findWithOrders(): Promise<Proveedor[]> {
    return await this.proveedorRepository
      .createQueryBuilder('proveedor')
      .innerJoin('proveedor.pedidos', 'pedido')
      .select(['proveedor.id', 'proveedor.nombre'])
      .distinct(true)
      .orderBy('proveedor.nombre', 'ASC')
      .getMany();
  }
}

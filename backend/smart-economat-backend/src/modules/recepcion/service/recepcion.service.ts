import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Recepcion } from '../recepcion.entity/recepcion.entity';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';
import { CreateRecepcionDto } from '../dto/create-recepcion.dto';
import { UpdateRecepcionDto } from '../dto/update-recepcion.dto';
import { I18nHelper } from '../../../common/helpers/i18n.helper';
import { MovimientoHelper } from '../../../common/helpers/movimiento.helper';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';

/**
 * Service responsible for managing goods receipt (Recepcion) records,
 * including creation with audit tracking, paginated retrieval, updates,
 * and guarded soft-deletion.
 *
 * @class RecepcionService
 */
@Injectable()
export class RecepcionService {
  /**
   * Creates an instance of RecepcionService.
   *
   * @param {Repository<Recepcion>} recepcionRepository - TypeORM repository for Recepcion.
   * @param {Repository<Usuario>} usuarioRepository - Repository used to validate user references.
   * @param {MovimientoHelper} movimientoHelper - Helper for recording stock movement audit events.
   */
  constructor(
    @InjectRepository(Recepcion)
    private readonly recepcionRepository: Repository<Recepcion>,

    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    private readonly movimientoHelper: MovimientoHelper
  ) {}

  /**
   * Creates a new goods receipt record and registers an audit movement entry.
   *
   * @param {CreateRecepcionDto} dto - Receipt creation payload.
   * @param {string} userId - UUID of the user performing the action.
   * @returns {Promise<Recepcion>} The newly created receipt entity.
   * @throws {BadRequestException} If the referenced user (dto.usuarioId) does not exist.
   */
  async create(dto: CreateRecepcionDto, userId: string): Promise<Recepcion> {
    const usuario = await this.usuarioRepository.findOne({
      where: { id: dto.usuarioId },
    });

    if (!usuario) {
      throw new BadRequestException(I18nHelper.getError('USER_DOES_NOT_EXIST'));
    }

    const recepcion = this.recepcionRepository.create({
      fechaRecepcion: dto.fechaRecepcion,
      observaciones: dto.observaciones,
      usuario,
      modifiedBy: userId,
    });

    const savedRecepcion = await this.recepcionRepository.save(recepcion);

    await this.movimientoHelper.trackRecepcion(
      userId,
      savedRecepcion.id,
      0,
      undefined,
      undefined,
      `Recepción creada: ${savedRecepcion.observaciones || 'Sin observaciones'}`
    );

    return savedRecepcion;
  }

  /**
   * Returns a paginated list of goods receipts ordered by reception date.
   * Admin users also receive soft-deleted records.
   *
   * @param {PaginationQueryDto} query - Pagination and sort parameters.
   * @param {string} [userRole] - Role of the requesting user; admins see deleted records.
   * @returns {Promise<PaginatedResponseDto<Recepcion>>} Paginated receipt list.
   */
  async findAll(
    query: PaginationQueryDto,
    userRole?: string
  ): Promise<PaginatedResponseDto<Recepcion>> {
    const isAdmin =
      userRole?.toUpperCase() === 'ADMIN' ||
      userRole?.toUpperCase() === 'SUPER_ADMIN';
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 50);
    const sortBy = query.sortBy ?? 'fechaRecepcion';
    const order = query.order ?? 'DESC';
    const [data, total] = await this.recepcionRepository.findAndCount({
      relations: ['usuario'],
      withDeleted: isAdmin,
      order: { [sortBy]: order },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit) || 1;
    return { data, total, page, limit, totalPages };
  }

  /**
   * Retrieves a single receipt by UUID with full relations, including linked
   * orders and product details. Admin users can also access soft-deleted records.
   *
   * @param {string} id - UUID of the receipt to retrieve.
   * @param {string} [userRole] - Role of the requesting user; admins see deleted records.
   * @returns {Promise<Recepcion>} The found receipt entity with all relations loaded.
   * @throws {NotFoundException} If no receipt with the given ID exists.
   */
  async findOne(id: string, userRole?: string): Promise<Recepcion> {
    const isAdmin =
      userRole?.toUpperCase() === 'ADMIN' ||
      userRole?.toUpperCase() === 'SUPER_ADMIN';

    const recepcion = await this.recepcionRepository.findOne({
      where: { id },
      withDeleted: isAdmin,
      relations: [
        'usuario',
        'recepcionesPedidos',
        'recepcionesPedidos.pedido',
        'recepcionProductos',
        'recepcionProductos.incidencia',
        'recepcionProductos.pedidoProducto',
        'recepcionProductos.pedidoProducto.productoProveedor',
        'recepcionProductos.pedidoProducto.productoProveedor.producto',
      ],
    });

    if (!recepcion) {
      throw new NotFoundException(I18nHelper.getError('RECEPTION_NOT_FOUND'));
    }

    return recepcion;
  }

  /**
   * Updates an existing receipt's fields. If a new user reference is provided,
   * it is validated before being applied.
   *
   * @param {string} id - UUID of the receipt to update.
   * @param {UpdateRecepcionDto} dto - Fields to update.
   * @param {string} [userId] - UUID of the user performing the update (for modifiedBy tracking).
   * @returns {Promise<Recepcion>} The updated receipt entity.
   * @throws {NotFoundException} If the receipt does not exist.
   * @throws {BadRequestException} If the referenced user (dto.usuarioId) does not exist.
   */
  async update(
    id: string,
    dto: UpdateRecepcionDto,
    userId?: string
  ): Promise<Recepcion> {
    const recepcion = await this.findOne(id);

    if (dto.usuarioId) {
      const usuario = await this.usuarioRepository.findOne({
        where: { id: dto.usuarioId },
      });

      if (!usuario) {
        throw new BadRequestException(
          I18nHelper.getError('USER_DOES_NOT_EXIST')
        );
      }

      recepcion.usuario = usuario;
    }

    this.recepcionRepository.merge(recepcion, dto);
    if (userId) {
      recepcion.modifiedBy = userId;
    }

    return await this.recepcionRepository.save(recepcion);
  }

  /**
   * Soft-deletes a receipt after verifying it has no associated orders or products.
   *
   * @param {string} id - UUID of the receipt to remove.
   * @returns {Promise<void>}
   * @throws {NotFoundException} If the receipt does not exist.
   * @throws {BadRequestException} If the receipt has linked orders or received products.
   */
  async remove(id: string): Promise<void> {
    const recepcion = await this.recepcionRepository.findOne({
      where: { id },
      relations: ['recepcionesPedidos', 'recepcionProductos'],
    });

    if (!recepcion) {
      throw new NotFoundException(I18nHelper.getError('RECEPTION_NOT_FOUND'));
    }

    if (
      recepcion.recepcionesPedidos?.length ||
      recepcion.recepcionProductos?.length
    ) {
      throw new BadRequestException(
        I18nHelper.getError('RECEPTION_HAS_RELATIONS')
      );
    }

    await this.recepcionRepository.softDelete(id);
  }
}

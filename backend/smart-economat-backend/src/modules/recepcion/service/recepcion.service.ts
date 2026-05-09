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
import { AccionMovimiento } from '../../movimiento/enums/movimiento.enums';

/**
 * Servicio encargado de la gestión de recepciones de mercancía.
 * Controla la persistencia de los registros de recepción y su asociación con usuarios y movimientos.
 */
@Injectable()
export class RecepcionService {
  /**
   * Crea una instancia de RecepcionService.
   * @param recepcionRepository Repositorio para la entidad Recepcion.
   * @param usuarioRepository Repositorio para la entidad Usuario.
   * @param movimientoHelper Ayudante para auditoría de movimientos.
   */
  constructor(
    @InjectRepository(Recepcion)
    private readonly recepcionRepository: Repository<Recepcion>,

    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    private readonly movimientoHelper: MovimientoHelper
  ) {}

  /**
   * Crea un registro de recepción básico.
   * @param dto Datos de la recepción.
   * @param userId ID del usuario que realiza la acción.
   * @returns El registro de recepción creado.
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
      `Recepción creada: ${savedRecepcion.observaciones || 'Sin observaciones'}`,
      AccionMovimiento.CREATE,
      undefined,
      savedRecepcion
    );

    return savedRecepcion;
  }

  /**
   * Obtiene una lista paginada de recepciones.
   * @param query Parámetros de paginación y ordenación.
   * @param userRole Rol del usuario solicitante.
   * @returns Respuesta paginada.
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
   * Busca una recepción por su ID cargando detalles de pedidos e incidencias.
   * @param id UUID de la recepción.
   * @param userRole Rol del usuario para control de visibilidad.
   * @returns La recepción con todo su desglose.
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
   * Actualiza los datos de una recepción.
   * @param id UUID de la recepción.
   * @param dto Datos a actualizar.
   * @param userId ID del usuario que modifica.
   * @returns La recepción actualizada.
   */
  async update(
    id: string,
    dto: UpdateRecepcionDto,
    userId?: string
  ): Promise<Recepcion> {
    const before = await this.findOne(id);

    if (dto.usuarioId) {
      const usuario = await this.usuarioRepository.findOne({
        where: { id: dto.usuarioId },
      });

      if (!usuario) {
        throw new BadRequestException(
          I18nHelper.getError('USER_DOES_NOT_EXIST')
        );
      }

      before.usuario = usuario;
    }

    this.recepcionRepository.merge(before, dto);
    if (userId) {
      before.modifiedBy = userId;
    }

    const after = await this.recepcionRepository.save(before);

    if (userId) {
      await this.movimientoHelper.trackAction({
        userId,
        entidad: 'Recepcion',
        entidadId: id,
        accion: AccionMovimiento.UPDATE,
        descripcion: `Actualización de recepción ${id}`,
        before,
        after,
      });
    }

    return after;
  }

  /**
   * Elimina lógicamente una recepción si no tiene líneas vinculadas.
   * @param id UUID de la recepción.
   * @throws BadRequestException Si la recepción tiene relaciones activas.
   */
  /**
   * Expone "remove" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {string | undefined} userId - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
   */
  async remove(id: string, userId?: string): Promise<void> {
    const before = await this.recepcionRepository.findOne({
      where: { id },
      relations: ['recepcionesPedidos', 'recepcionProductos'],
    });

    if (!before) {
      throw new NotFoundException(I18nHelper.getError('RECEPTION_NOT_FOUND'));
    }

    if (
      before.recepcionesPedidos?.length ||
      before.recepcionProductos?.length
    ) {
      throw new BadRequestException(
        I18nHelper.getError('RECEPTION_HAS_RELATIONS')
      );
    }

    await this.recepcionRepository.softDelete(id);

    if (userId) {
      await this.movimientoHelper.trackAction({
        userId,
        entidad: 'Recepcion',
        entidadId: id,
        accion: AccionMovimiento.DELETE,
        descripcion: `Eliminación de recepción ${id}`,
        before,
      });
    }
  }
}

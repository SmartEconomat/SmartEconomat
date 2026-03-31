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

@Injectable()
export class RecepcionService {
  constructor(
    @InjectRepository(Recepcion)
    private readonly recepcionRepository: Repository<Recepcion>,

    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    private readonly movimientoHelper: MovimientoHelper
  ) {}

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

  async update(id: string, dto: UpdateRecepcionDto): Promise<Recepcion> {
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

    return await this.recepcionRepository.save(recepcion);
  }

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

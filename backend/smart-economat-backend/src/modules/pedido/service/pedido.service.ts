import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Pedido } from '../pedido.entity/pedido.entity';
import { EstadoPedido } from '../enums/estado-pedido.enum';
import { CreatePedidoDto } from '../dto/create-pedido.dto';
import { UpdatePedidoDto } from '../dto/updatePedido.dto';
import { CancelPedidoDto } from '../dto/cancelPedido.dto';
import { PedidoRepository } from '../repository/pedido.repository';
import { PedidoProducto } from '../pedido-producto.entity/pedido-producto.entity';
import { ProductoProveedor } from '../../producto/producto-proveedor.entity/producto-proveedor.entity';
import { I18nHelper } from '../../../common/helpers/i18n.helper';
import { MovimientoHelper } from '../../../common/helpers/movimiento.helper';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';

@Injectable()
export class PedidoService {
  constructor(
    private readonly pedidoRepository: PedidoRepository,
    private readonly movimientoHelper: MovimientoHelper,
    private readonly dataSource: DataSource
  ) {}

  async create(
    createPedidoDto: CreatePedidoDto,
    userId: string
  ): Promise<Pedido> {
    const { lineas, fechaEntrega, proveedorId, ...pedidoFields } = createPedidoDto;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let costeTotal = 0;
      const pedidoProductosEntities: any[] = [];

      for (const linea of lineas) {
        // Validar que el ProductoProveedor existe y obtener el precio vigente
        const productoProveedor = await queryRunner.manager.findOne(ProductoProveedor, {
          where: { id: linea.productoProveedorId },
        });

        if (!productoProveedor) {
          throw new NotFoundException(`El producto proveedor con ID ${linea.productoProveedorId} no existe.`);
        }

        if (productoProveedor.proveedorId !== proveedorId) {
          throw new BadRequestException(`El producto proveedor con ID ${linea.productoProveedorId} no pertenece al proveedor del pedido.`);
        }

        const precioVigente = productoProveedor.precioUnitario;
        if (precioVigente === null || precioVigente === undefined) {
          throw new ConflictException(`El producto proveedor con ID ${linea.productoProveedorId} no tiene un precio vigente (precio pactado) configurado.`);
        }

        const costeLinea = Number(precioVigente) * Number(linea.cantidad);
        costeTotal += costeLinea;

        pedidoProductosEntities.push({
          productoProveedor: { id: productoProveedor.id },
          cantidad: linea.cantidad,
          precioUnitario: precioVigente, // snapshot del precio vigente (precio_pactado)
        });
      }

      const pedido = queryRunner.manager.create(Pedido, {
        ...pedidoFields,
        usuario: { id: userId },
        proveedor: { id: proveedorId },
        estado: EstadoPedido.PENDIENTE,
        costeTotal,
        fechaEntrega: new Date(fechaEntrega),
      });

      const savedPedido = await queryRunner.manager.save(Pedido, pedido);

      for (const pp of pedidoProductosEntities) {
        await queryRunner.manager.save(PedidoProducto, {
          ...pp,
          pedido: { id: savedPedido.id },
        });
      }

      await queryRunner.commitTransaction();

      await this.movimientoHelper.trackPedidoCreation(
        userId,
        savedPedido.id,
        `Creación de pedido #${savedPedido.id}`
      );

      return await this.findOne(savedPedido.id);
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new ConflictException(`Error al crear el pedido: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(
    query: PaginationQueryDto
  ): Promise<PaginatedResponseDto<Pedido>> {
    return await this.pedidoRepository.findAllPaginated(query, true);
  }

  async findOne(id: string): Promise<Pedido> {
    const pedido = await this.pedidoRepository.findOneWithRelations(id, true);
    if (!pedido) {
      throw new NotFoundException(I18nHelper.getError('ORDER_NOT_FOUND'));
    }
    return pedido;
  }

  async update(id: string, updatePedidoDto: UpdatePedidoDto): Promise<Pedido> {
    const pedido = await this.findOne(id);

    if (updatePedidoDto.fechaEntrega) {
      pedido.fechaEntrega = new Date(updatePedidoDto.fechaEntrega);
    }

    if (updatePedidoDto.estado) {
      pedido.estado = updatePedidoDto.estado;
    }

    if (updatePedidoDto.proveedorId) {
      pedido.proveedor = { id: updatePedidoDto.proveedorId } as any;
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (updatePedidoDto.lineas !== undefined) {
        if (updatePedidoDto.lineas.length === 0) {
          throw new BadRequestException('El pedido debe contener al menos un producto.');
        }

        await queryRunner.manager.delete(PedidoProducto, {
          pedido: { id },
        });

        const lineasActualizadas: any[] = [];
        let nuevoCosteTotal = 0;

        for (const linea of updatePedidoDto.lineas) {
          const productoProveedor = await queryRunner.manager.findOne(ProductoProveedor, {
            where: { id: linea.productoProveedorId },
          });

          if (!productoProveedor) {
            throw new NotFoundException(`El producto proveedor con ID ${linea.productoProveedorId} no existe.`);
          }

          const precioVigente = productoProveedor.precioUnitario;
          if (precioVigente === null || precioVigente === undefined) {
            throw new ConflictException(`El producto proveedor con ID ${linea.productoProveedorId} no tiene un precio vigente.`);
          }

          const costeLinea = Number(precioVigente) * Number(linea.cantidad);
          nuevoCosteTotal += costeLinea;

          lineasActualizadas.push({
            pedido: { id: pedido.id },
            productoProveedor: { id: productoProveedor.id },
            cantidad: linea.cantidad,
            precioUnitario: precioVigente,
          });
        }

        pedido.costeTotal = nuevoCosteTotal;

        for (const linea of lineasActualizadas) {
          await queryRunner.manager.save(PedidoProducto, linea);
        }
      }

      const savedPedido = await queryRunner.manager.save(Pedido, pedido);
      await queryRunner.commitTransaction();

      return await this.findOne(savedPedido.id);
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new ConflictException(`Error al actualizar el pedido: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  async updateFechaEntrega(id: string, dto: UpdatePedidoDto): Promise<Pedido> {
    const pedido = await this.findOne(id);

    if (dto.fechaEntrega) {
      pedido.fechaEntrega = new Date(dto.fechaEntrega);
      return await this.pedidoRepository.save(pedido);
    }

    return pedido;
  }

  async cancelarPedido(id: string, dto: CancelPedidoDto): Promise<Pedido> {
    const pedido = await this.findOne(id);

    if (
      pedido.estado === EstadoPedido.RECIBIDO ||
      pedido.estado === EstadoPedido.EN_PROCESO
    ) {
      throw new BadRequestException(
        I18nHelper.getError('ORDER_NOT_CANCELLABLE')
      );
    }

    pedido.cancelar(dto.motivoCancelacion || 'Cancelado por el usuario');
    return await this.pedidoRepository.save(pedido);
  }

  async remove(id: string): Promise<void> {
    const pedido = await this.findOne(id);

    if (
      pedido.estado !== EstadoPedido.PENDIENTE &&
      pedido.estado !== EstadoPedido.CANCELADO
    ) {
      throw new BadRequestException(
        I18nHelper.getError('ORDER_CANNOT_BE_DELETED')
      );
    }

    await this.pedidoRepository.remove(pedido);
  }
}

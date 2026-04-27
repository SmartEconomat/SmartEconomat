import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { SortableFields } from '../../../common/decorators/sortable-fields.decorator';
import { ParseUUIDv7Pipe } from '../../../common/pipes';
import { CreatePedidoDto } from '../dto/create-pedido.dto';
import { CancelPedidoDto } from '../dto/cancelPedido.dto';
import { UpdatePedidoDto } from '../dto/updatePedido.dto';
import { Pedido } from '../pedido.entity/pedido.entity';
import { PedidoService } from '../service/pedido.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { PermisosGuard } from '../../auth/guards/auth-permissions.guard';
import { GeneratePedidoFromRecetasDto } from '../dto/generate-pedido-from-recetas.dto';
import { RecetaToPedidoService } from '../service/receta-to-pedido.service';
import { PERMISSIONS } from '../../../common/constants/permissions.constants';

/**
 * Documentación en español.
 */
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('pedidos')
export class PedidoController {
  private withPedidoLabels<T extends { estado?: string | null }>(
    pedido: T
  ): T & {
    estadoLabelKey?: string;
  } {
    if (!pedido?.estado) {
      return pedido;
    }

    return {
      ...pedido,
      estadoLabelKey: `enum.pedidoEstado.${String(pedido.estado).toUpperCase()}`,
    };
  }
  /**
   * Documentación en español.
   */
  constructor(
    private readonly pedidoService: PedidoService,
    private readonly recetaToPedidoService: RecetaToPedidoService
  ) {}

  /**
   * Documentación en español.
   */
  @Post()
  @RequirePermissions(PERMISSIONS.pedidos.crear)
  create(
    @Body() dto: CreatePedidoDto,
    @Req() req: { user: { id: string } }
  ): Promise<Pedido> {
    const userId = req.user.id;
    return this.pedidoService
      .create(dto, userId)
      .then((pedido) => this.withPedidoLabels(pedido));
  }

  /**
   * Documentación en español.
   */
  @Get()
  @RequirePermissions(PERMISSIONS.pedidos.listar)
  findAll(
    @SortableFields({
      fechaPedido: 'fechaPedido',
      fechaEntrega: 'fechaEntrega',
      costeTotal: 'costeTotal',
      estado: 'estado',
      fechaCreacion: 'createdAt',
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    })
    query: PaginationQueryDto
  ): Promise<PaginatedResponseDto<Pedido>> {
    return this.pedidoService.findAll(query).then((result) => ({
      ...result,
      data: result.data.map((pedido) => this.withPedidoLabels(pedido)),
    }));
  }

  /**
   * Documentación en español.
   */
  @Post('from-recipes')
  @RequirePermissions(PERMISSIONS.pedidos.crear)
  createFromRecipes(
    @Body() dto: GeneratePedidoFromRecetasDto,
    @Req() req: { user: { id: string } }
  ): Promise<Pedido> {
    const userId = req.user.id;
    return this.recetaToPedidoService
      .generateFromRecetas(dto, userId)
      .then((pedido) => this.withPedidoLabels(pedido));
  }

  /**
   * Documentación en español.
   */
  @Get(':id')
  @RequirePermissions(PERMISSIONS.pedidos.ver)
  findOne(@Param('id', ParseUUIDv7Pipe) id: string): Promise<Pedido> {
    return this.pedidoService
      .findOne(id)
      .then((pedido) => this.withPedidoLabels(pedido));
  }

  /**
   * Documentación en español.
   */
  @Patch(':id')
  @RequirePermissions(PERMISSIONS.pedidos.editar)
  update(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Body() dto: UpdatePedidoDto,
    @Req() req: { user: { id: string } }
  ): Promise<Pedido> {
    return this.pedidoService
      .update(id, dto, req.user.id)
      .then((pedido) => this.withPedidoLabels(pedido));
  }

  /**
   * Documentación en español.
   */
  @Delete(':id')
  @RequirePermissions(PERMISSIONS.pedidos.eliminar)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDv7Pipe) id: string): Promise<void> {
    return this.pedidoService.remove(id);
  }

  /**
   * Documentación en español.
   */
  @Patch(':id/fecha-entrega')
  @RequirePermissions(PERMISSIONS.pedidos.editar)
  updateFechaEntrega(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Body() dto: UpdatePedidoDto
  ): Promise<Pedido> {
    return this.pedidoService
      .updateFechaEntrega(id, dto)
      .then((pedido) => this.withPedidoLabels(pedido));
  }

  /**
   * Documentación en español.
   */
  @Patch(':id/cancelar')
  @RequirePermissions(PERMISSIONS.pedidos.cancelar)
  cancelarPedido(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Body() dto: CancelPedidoDto,
    @Req() req: { user: { id: string } }
  ): Promise<Pedido> {
    return this.pedidoService
      .cancelarPedido(id, dto, req.user.id)
      .then((pedido) => this.withPedidoLabels(pedido));
  }

  /**
   * Documentación en español.
   */
  @Patch(':id/aceptar')
  @RequirePermissions(PERMISSIONS.pedidos.editar)
  aceptarPedido(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Req() req: { user: { id: string } }
  ): Promise<Pedido> {
    return this.pedidoService
      .aceptarPedido(id, req.user.id)
      .then((pedido) => this.withPedidoLabels(pedido));
  }

  /**
   * Documentación en español.
   */
  @Patch(':id/restaurar')
  @RequirePermissions(PERMISSIONS.pedidos.restaurar)
  restaurarPedido(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Req() req: { user: { id: string } }
  ): Promise<Pedido> {
    return this.pedidoService
      .restaurarPedido(id, req.user.id)
      .then((pedido) => this.withPedidoLabels(pedido));
  }
}

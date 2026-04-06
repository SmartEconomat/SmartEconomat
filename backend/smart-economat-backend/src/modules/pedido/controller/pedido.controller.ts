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

@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('pedidos')
export class PedidoController {
  constructor(
    private readonly pedidoService: PedidoService,
    private readonly recetaToPedidoService: RecetaToPedidoService
  ) {}

  @Post()
  @RequirePermissions(PERMISSIONS.pedidos.crear)
  create(
    @Body() dto: CreatePedidoDto,
    @Req() req: { user: { id: string } }
  ): Promise<Pedido> {
    const userId = req.user.id;
    return this.pedidoService.create(dto, userId);
  }

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
    return this.pedidoService.findAll(query);
  }

  @Post('from-recipes')
  @RequirePermissions(PERMISSIONS.pedidos.crear)
  createFromRecipes(
    @Body() dto: GeneratePedidoFromRecetasDto,
    @Req() req: { user: { id: string } }
  ): Promise<Pedido> {
    const userId = req.user.id;
    return this.recetaToPedidoService.generateFromRecetas(dto, userId);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.pedidos.ver)
  findOne(@Param('id', ParseUUIDv7Pipe) id: string): Promise<Pedido> {
    return this.pedidoService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.pedidos.editar)
  update(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Body() dto: UpdatePedidoDto,
    @Req() req: { user: { id: string } }
  ): Promise<Pedido> {
    return this.pedidoService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.pedidos.eliminar)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDv7Pipe) id: string): Promise<void> {
    return this.pedidoService.remove(id);
  }

  @Patch(':id/fecha-entrega')
  @RequirePermissions(PERMISSIONS.pedidos.editar)
  updateFechaEntrega(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Body() dto: UpdatePedidoDto
  ): Promise<Pedido> {
    return this.pedidoService.updateFechaEntrega(id, dto);
  }

  @Patch(':id/cancelar')
  @RequirePermissions(PERMISSIONS.pedidos.cancelar)
  cancelarPedido(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Body() dto: CancelPedidoDto,
    @Req() req: { user: { id: string } }
  ): Promise<Pedido> {
    return this.pedidoService.cancelarPedido(id, dto, req.user.id);
  }

  @Patch(':id/aceptar')
  @RequirePermissions(PERMISSIONS.pedidos.editar)
  aceptarPedido(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Req() req: { user: { id: string } }
  ): Promise<Pedido> {
    return this.pedidoService.aceptarPedido(id, req.user.id);
  }

  @Patch(':id/restaurar')
  @RequirePermissions(PERMISSIONS.pedidos.restaurar)
  restaurarPedido(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Req() req: { user: { id: string } }
  ): Promise<Pedido> {
    return this.pedidoService.restaurarPedido(id, req.user.id);
  }
}

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
  Request,
  Query,
} from '@nestjs/common';
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

@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('pedidos')
export class PedidoController {
  constructor(private readonly pedidoService: PedidoService) {}

  @Post()
  @RequirePermissions('pedidos:crear')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreatePedidoDto, @Request() req: any): Promise<Pedido> {
    const userId = req.user.sub as string;
    return this.pedidoService.create(dto, userId);
  }

  @Get()
  @RequirePermissions('pedidos:listar')
  findAll(
    @Query() query: PaginationQueryDto
  ): Promise<PaginatedResponseDto<Pedido>> {
    return this.pedidoService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('pedidos:ver')
  findOne(@Param('id', ParseUUIDv7Pipe) id: string): Promise<Pedido> {
    return this.pedidoService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('pedidos:editar')
  update(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Body() dto: UpdatePedidoDto
  ): Promise<Pedido> {
    return this.pedidoService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('pedidos:eliminar')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDv7Pipe) id: string): Promise<void> {
    return this.pedidoService.remove(id);
  }

  @Patch(':id/fecha-entrega')
  @RequirePermissions('pedidos:editar')
  updateFechaEntrega(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Body() dto: UpdatePedidoDto
  ): Promise<Pedido> {
    return this.pedidoService.updateFechaEntrega(id, dto);
  }

  @Patch(':id/cancelar')
  @RequirePermissions('pedidos:cancelar')
  cancelarPedido(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Body() dto: CancelPedidoDto
  ): Promise<Pedido> {
    return this.pedidoService.cancelarPedido(id, dto);
  }
}

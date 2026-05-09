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
import { validateDateRange } from '../../../common/utils/date-range.util';
import { SORTABLE_FIELDS } from '../../../common/constants/sortable-fields.constants';

/**
 * Controlador para la gestión de pedidos a proveedores.
 * Maneja el ciclo de vida de los pedidos, desde su creación (manual o desde recetas)
 * hasta su cancelación, aceptación y seguimiento de fechas de entrega.
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
   * Crea una instancia de PedidoController.
   * @param pedidoService Servicio central de gestión de pedidos.
   * @param recetaToPedidoService Servicio especializado para la generación de pedidos basados en escandallos de recetas.
   */
  constructor(
    private readonly pedidoService: PedidoService,
    private readonly recetaToPedidoService: RecetaToPedidoService
  ) {}

  /**
   * Crea un nuevo pedido a proveedor.
   * @param dto Datos del pedido (proveedor, productos, cantidades).
   * @param req Petición para obtener el ID del usuario creador.
   * @returns El pedido creado con etiquetas de internacionalización.
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
   * Lista los pedidos con soporte para paginación y ordenación por múltiples campos.
   * @param query Parámetros de consulta (filtros, página, límite, orden).
   * @returns Lista paginada de pedidos con etiquetas de estado.
   */
  @Get()
  @RequirePermissions(PERMISSIONS.pedidos.listar)
  findAll(
    @SortableFields(SORTABLE_FIELDS.pedidos)
    query: PaginationQueryDto
  ): Promise<PaginatedResponseDto<Pedido>> {
    validateDateRange(query.fechaDesde, query.fechaHasta);
    return this.pedidoService.findAll(query).then((result) => ({
      ...result,
      data: result.data.map((pedido) => this.withPedidoLabels(pedido)),
    }));
  }

  /**
   * Genera un pedido automáticamente a partir de una lista de recetas y raciones.
   * Calcula las necesidades de materia prima basándose en los ingredientes de las recetas.
   * @param dto Lista de recetas y raciones a producir.
   * @param req Petición para obtener el usuario solicitante.
   * @returns El pedido generado.
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
   * Obtiene el detalle completo de un pedido por su ID.
   * @param id UUID del pedido.
   * @returns El pedido solicitado.
   */
  @Get(':id')
  @RequirePermissions(PERMISSIONS.pedidos.ver)
  findOne(@Param('id', ParseUUIDv7Pipe) id: string): Promise<Pedido> {
    return this.pedidoService
      .findOne(id)
      .then((pedido) => this.withPedidoLabels(pedido));
  }

  /**
   * Actualiza los datos de un pedido existente.
   * @param id UUID del pedido.
   * @param dto Nuevos datos.
   * @param req Petición para auditoría de usuario.
   * @returns El pedido actualizado.
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
   * Elimina un pedido del sistema (eliminación lógica).
   * @param id UUID del pedido.
   */
  /**
   * Expone "remove" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {{ user: { id: string; }; }} req - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
   */
  @Delete(':id')
  @RequirePermissions(PERMISSIONS.pedidos.eliminar)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Req() req: { user: { id: string } }
  ): Promise<void> {
    return this.pedidoService.remove(id, req.user.id);
  }

  /**
   * Actualiza únicamente la fecha estimada de entrega de un pedido.
   * @param id UUID del pedido.
   * @param dto DTO que contiene la nueva fecha.
   * @returns El pedido modificado.
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
   * Cancela un pedido especificando el motivo de la cancelación.
   * @param id UUID del pedido.
   * @param dto Motivo de la cancelación.
   * @param req Petición para auditoría.
   * @returns El pedido en estado cancelado.
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
   * Acepta un pedido (cambio de estado tras revisión).
   * @param id UUID del pedido.
   * @param req Petición para auditoría.
   * @returns El pedido aceptado.
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
   * Restaura un pedido que fue previamente eliminado o cancelado.
   * @param id UUID del pedido.
   * @param req Petición para auditoría.
   * @returns El pedido restaurado.
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

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
 * Controller that exposes REST endpoints for managing purchase orders (pedidos).
 * All routes require JWT authentication and permission-based authorization.
 *
 * @class PedidoController
 */
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('pedidos')
export class PedidoController {
  /**
   * Creates an instance of PedidoController.
   *
   * @param {PedidoService} pedidoService - Service handling core pedido business logic.
   * @param {RecetaToPedidoService} recetaToPedidoService - Service for generating pedidos from recipe ingredient requirements.
   */
  constructor(
    private readonly pedidoService: PedidoService,
    private readonly recetaToPedidoService: RecetaToPedidoService
  ) {}

  /**
   * Creates a new purchase order.
   *
   * @param {CreatePedidoDto} dto - Body containing order header and product lines.
   * @param {{ user: { id: string } }} req - Express request object with the authenticated user.
   * @returns {Promise<Pedido>} The created pedido with all relations.
   * @throws {NotFoundException} When a referenced product or supplier does not exist.
   * @throws {ConflictException} When a database conflict occurs during creation.
   * @example
   * POST /pedidos
   */
  @Post()
  @RequirePermissions(PERMISSIONS.pedidos.crear)
  create(
    @Body() dto: CreatePedidoDto,
    @Req() req: { user: { id: string } }
  ): Promise<Pedido> {
    const userId = req.user.id;
    return this.pedidoService.create(dto, userId);
  }

  /**
   * Returns a paginated list of all purchase orders.
   *
   * @param {PaginationQueryDto} query - Pagination, sorting, and filtering parameters.
   * @returns {Promise<PaginatedResponseDto<Pedido>>} Paginated collection of pedidos.
   * @example
   * GET /pedidos?page=1&limit=20&sortBy=fechaPedido&order=DESC
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
    return this.pedidoService.findAll(query);
  }

  /**
   * Generates a purchase order automatically from the ingredient requirements of one or more recipes.
   *
   * @param {GeneratePedidoFromRecetasDto} dto - Body containing the recipe IDs to use as the source.
   * @param {{ user: { id: string } }} req - Express request object with the authenticated user.
   * @returns {Promise<Pedido>} The generated pedido derived from the recipe ingredients.
   * @throws {NotFoundException} When a referenced recipe does not exist.
   * @throws {BadRequestException} When no purchasable ingredients are found.
   * @example
   * POST /pedidos/from-recipes
   */
  @Post('from-recipes')
  @RequirePermissions(PERMISSIONS.pedidos.crear)
  createFromRecipes(
    @Body() dto: GeneratePedidoFromRecetasDto,
    @Req() req: { user: { id: string } }
  ): Promise<Pedido> {
    const userId = req.user.id;
    return this.recetaToPedidoService.generateFromRecetas(dto, userId);
  }

  /**
   * Retrieves a single purchase order by its UUID.
   *
   * @param {string} id - UUID v7 of the pedido.
   * @returns {Promise<Pedido>} The found pedido with all relations.
   * @throws {NotFoundException} When no pedido exists with the given ID.
   * @example
   * GET /pedidos/:id
   */
  @Get(':id')
  @RequirePermissions(PERMISSIONS.pedidos.ver)
  findOne(@Param('id', ParseUUIDv7Pipe) id: string): Promise<Pedido> {
    return this.pedidoService.findOne(id);
  }

  /**
   * Updates an existing purchase order's header fields and/or product lines.
   *
   * @param {string} id - UUID v7 of the pedido to update.
   * @param {UpdatePedidoDto} dto - Fields to update.
   * @param {{ user: { id: string } }} req - Express request object with the authenticated user.
   * @returns {Promise<Pedido>} The updated pedido with all relations reloaded.
   * @throws {NotFoundException} When the pedido or a referenced ProductoProveedor does not exist.
   * @throws {BadRequestException} When the updated line list is empty.
   * @throws {ConflictException} When a referenced product has no valid price.
   * @example
   * PATCH /pedidos/:id
   */
  @Patch(':id')
  @RequirePermissions(PERMISSIONS.pedidos.editar)
  update(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Body() dto: UpdatePedidoDto,
    @Req() req: { user: { id: string } }
  ): Promise<Pedido> {
    return this.pedidoService.update(id, dto, req.user.id);
  }

  /**
   * Soft-deletes a purchase order. Only orders in PENDIENTE_DE_APROBACION or CANCELADO state can be deleted.
   *
   * @param {string} id - UUID v7 of the pedido to delete.
   * @returns {Promise<void>}
   * @throws {NotFoundException} When no pedido exists with the given ID.
   * @throws {BadRequestException} When the pedido state prevents deletion.
   * @example
   * DELETE /pedidos/:id
   */
  @Delete(':id')
  @RequirePermissions(PERMISSIONS.pedidos.eliminar)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDv7Pipe) id: string): Promise<void> {
    return this.pedidoService.remove(id);
  }

  /**
   * Updates the expected delivery date of a purchase order.
   *
   * @param {string} id - UUID v7 of the pedido.
   * @param {UpdatePedidoDto} dto - DTO containing the new delivery date.
   * @returns {Promise<Pedido>} The updated pedido.
   * @throws {NotFoundException} When no pedido exists with the given ID.
   * @example
   * PATCH /pedidos/:id/fecha-entrega
   */
  @Patch(':id/fecha-entrega')
  @RequirePermissions(PERMISSIONS.pedidos.editar)
  updateFechaEntrega(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Body() dto: UpdatePedidoDto
  ): Promise<Pedido> {
    return this.pedidoService.updateFechaEntrega(id, dto);
  }

  /**
   * Cancels a purchase order that is in PENDIENTE_DE_APROBACION state.
   *
   * @param {string} id - UUID v7 of the pedido to cancel.
   * @param {CancelPedidoDto} dto - DTO containing the cancellation reason.
   * @param {{ user: { id: string } }} req - Express request object with the authenticated user.
   * @returns {Promise<Pedido>} The updated pedido in CANCELADO state.
   * @throws {NotFoundException} When no pedido exists with the given ID.
   * @throws {BadRequestException} When the pedido cannot be cancelled in its current state.
   * @example
   * PATCH /pedidos/:id/cancelar
   */
  @Patch(':id/cancelar')
  @RequirePermissions(PERMISSIONS.pedidos.cancelar)
  cancelarPedido(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Body() dto: CancelPedidoDto,
    @Req() req: { user: { id: string } }
  ): Promise<Pedido> {
    return this.pedidoService.cancelarPedido(id, dto, req.user.id);
  }

  /**
   * Accepts a pending purchase order, transitioning it to POR_RECEPCIONAR state.
   *
   * @param {string} id - UUID v7 of the pedido to accept.
   * @param {{ user: { id: string } }} req - Express request object with the authenticated user.
   * @returns {Promise<Pedido>} The updated pedido in POR_RECEPCIONAR state.
   * @throws {NotFoundException} When no pedido exists with the given ID.
   * @throws {BadRequestException} When the pedido is not in PENDIENTE_DE_APROBACION state.
   * @example
   * PATCH /pedidos/:id/aceptar
   */
  @Patch(':id/aceptar')
  @RequirePermissions(PERMISSIONS.pedidos.editar)
  aceptarPedido(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Req() req: { user: { id: string } }
  ): Promise<Pedido> {
    return this.pedidoService.aceptarPedido(id, req.user.id);
  }

  /**
   * Restores a previously cancelled purchase order back to PENDIENTE_DE_APROBACION state.
   *
   * @param {string} id - UUID v7 of the pedido to restore.
   * @param {{ user: { id: string } }} req - Express request object with the authenticated user.
   * @returns {Promise<Pedido>} The updated pedido in PENDIENTE_DE_APROBACION state.
   * @throws {NotFoundException} When no pedido exists with the given ID.
   * @throws {BadRequestException} When the pedido is not in CANCELADO state.
   * @example
   * PATCH /pedidos/:id/restaurar
   */
  @Patch(':id/restaurar')
  @RequirePermissions(PERMISSIONS.pedidos.restaurar)
  restaurarPedido(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Req() req: { user: { id: string } }
  ): Promise<Pedido> {
    return this.pedidoService.restaurarPedido(id, req.user.id);
  }
}

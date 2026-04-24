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
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { InventarioService } from '../service/inventario.service';
import { CreateInventarioItemDto } from '../dto/create-InventarioItem.dto';
import { CreateMovimientoManualDto } from '../dto/create-movimiento-manual.dto';
import { InventoryQueryDto } from '../dto/inventory-query.dto';
import {
  StockConsolidadoDto,
  StockPorUbicacionDto,
} from '../dto/stock-result.dto';
import { UpdateInventarioDto } from '../dto/update-inventario.dto';
import { Inventario } from '../inventario.entity/inventario.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { SortableFields } from '../../../common/decorators/sortable-fields.decorator';
import { PermisosGuard } from '../../auth/guards/auth-permissions.guard';
import { PERMISSIONS } from '../../../common/constants/permissions.constants';

/**
 * Controller that exposes REST endpoints for inventory management.
 * All routes require JWT authentication and specific inventory permissions.
 *
 * @class InventarioController
 */
@ApiTags('Inventario')
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('inventario')
export class InventarioController {
  constructor(private readonly inventarioService: InventarioService) {}

  /**
   * Creates a new inventory item for a product-provider relation at a specified location.
   * Also registers an initial ENTRADA movement for audit purposes.
   *
   * @param {CreateInventarioItemDto} createInventarioDto - DTO with inventory creation details.
   * @param {string} userId - The ID of the authenticated user (from JWT).
   * @returns {Promise<Inventario>} The newly created inventory entity.
   * @throws {NotFoundException} When the product-provider relation is not found.
   * @throws {BadRequestException} When a database constraint violation occurs.
   */
  @Post()
  @RequirePermissions(PERMISSIONS.inventario.crear)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createInventarioDto: CreateInventarioItemDto,
    @GetUser('id') userId: string
  ): Promise<Inventario> {
    return this.inventarioService.create(createInventarioDto, userId);
  }

  /**
   * Retrieves a paginated list of inventory items.
   * Admin and Super Admin users can also see soft-deleted records.
   *
   * @param {PaginationQueryDto} query - Pagination and sorting parameters validated via SortableFields.
   * @param {string} userRole - The role of the authenticated user (from JWT), used to control visibility of deleted records.
   * @returns {Promise<PaginatedResponseDto<Inventario>>} Paginated inventory data.
   */
  @Get()
  @RequirePermissions(PERMISSIONS.inventario.listar)
  findAll(
    @SortableFields([
      'cantidadActual',
      'cantidadMinima',
      'cantidadMaxima',
      'fechaEntrada',
      'fechaCaducidad',
      'createdAt',
      'updatedAt',
    ])
    query: PaginationQueryDto,
    @GetUser('rol') userRole: string
  ): Promise<PaginatedResponseDto<Inventario>> {
    return this.inventarioService.findAll(query, userRole);
  }

  /**
   * Queries stock levels either consolidated or broken down by location.
   *
   * @param {InventoryQueryDto} dto - Query parameters specifying filters and the grouping mode.
   * @returns {Promise<StockPorUbicacionDto[] | StockConsolidadoDto[]>} Stock data grouped by location or consolidated.
   */
  @Get('stock')
  @RequirePermissions(PERMISSIONS.inventario.listar)
  queryStock(
    @Query() dto: InventoryQueryDto
  ): Promise<StockPorUbicacionDto[] | StockConsolidadoDto[]> {
    return this.inventarioService.queryStock(dto);
  }

  /**
   * Registers a manual stock adjustment with full audit trail.
   * Uses a pessimistic write lock to prevent race conditions.
   *
   * @param {CreateMovimientoManualDto} dto - DTO specifying the inventory ID, adjustment amount, type, reason, and optional observations.
   * @param {string} userId - The ID of the authenticated user (from JWT).
   * @returns {Promise<Inventario>} The updated inventory entity after the adjustment.
   * @throws {NotFoundException} When the inventory item is not found.
   * @throws {ConflictException} When the item is soft-deleted or the adjustment would result in negative stock.
   * @throws {BadRequestException} When the adjustment amount is zero or inconsistent with the movement type.
   */
  @Post('ajustes-manuales')
  @RequirePermissions(PERMISSIONS.inventario.ajustar_stock)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar un ajuste manual de stock con auditoría',
  })
  @ApiBody({ type: CreateMovimientoManualDto })
  @ApiResponse({
    status: 201,
    type: Inventario,
    description: 'Inventario actualizado y movimiento auditado',
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos para el ajuste' })
  @ApiResponse({
    status: 404,
    description: 'Inventario no encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'El ajuste deja el stock en negativo',
  })
  ajustarManual(
    @Body() dto: CreateMovimientoManualDto,
    @GetUser('id') userId: string
  ): Promise<Inventario> {
    return this.inventarioService.ajustarManual(dto, userId);
  }

  /**
   * Retrieves a single inventory item by its UUID.
   *
   * @param {string} id - The UUID of the inventory item (from route param).
   * @param {string} userRole - The role of the authenticated user (from JWT); admins can see deleted records.
   * @returns {Promise<Inventario>} The found inventory entity with related data.
   * @throws {NotFoundException} When the inventory item is not found.
   */
  @Get(':id')
  @RequirePermissions(PERMISSIONS.inventario.ver)
  findOne(
    @Param('id') id: string,
    @GetUser('rol') userRole: string
  ): Promise<Inventario> {
    return this.inventarioService.findOne(id, userRole);
  }

  /**
   * Updates an existing inventory item. If the quantity changes, a corresponding
   * ENTRADA or SALIDA movement is registered for audit purposes.
   *
   * @param {string} id - The UUID of the inventory item to update (from route param).
   * @param {UpdateInventarioDto} updateInventarioDto - DTO with the fields to update.
   * @param {string} userId - The ID of the authenticated user (from JWT).
   * @returns {Promise<Inventario>} The updated inventory entity.
   * @throws {NotFoundException} When the inventory item or product-provider is not found.
   * @throws {BadRequestException} When a database constraint violation occurs.
   */
  @Patch(':id')
  @RequirePermissions(PERMISSIONS.inventario.editar)
  update(
    @Param('id') id: string,
    @Body() updateInventarioDto: UpdateInventarioDto,
    @GetUser('id') userId: string
  ): Promise<Inventario> {
    return this.inventarioService.update(id, updateInventarioDto, userId);
  }

  /**
   * Soft-deletes an inventory item and registers a SALIDA movement for the remaining stock.
   *
   * @param {string} id - The UUID of the inventory item to remove (from route param).
   * @param {string} userId - The ID of the authenticated user (from JWT).
   * @returns {Promise<void>}
   * @throws {NotFoundException} When the inventory item is not found.
   */
  @Delete(':id')
  @RequirePermissions(PERMISSIONS.inventario.eliminar)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id') id: string,
    @GetUser('id') userId: string
  ): Promise<void> {
    return this.inventarioService.remove(id, userId);
  }
}

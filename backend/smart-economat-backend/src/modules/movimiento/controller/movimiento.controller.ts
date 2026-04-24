import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SortableFields } from '../../../common/decorators/sortable-fields.decorator';
import { Movimiento } from '../movimiento.entity/movimiento.entity';
import { MovimientoService } from '../service/movimiento.service';
import { CreateMovimientoDto } from '../dto/create-movimiento.dto';
import { UpdateMovimientoDto } from '../dto/update-movimiento.dto';
import { MovimientoHistoryDto } from '../dto/movimiento-history.dto';
import { MovimientoListQueryDto } from '../dto/movimiento-list-query.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermisosGuard } from '../../auth/guards/auth-permissions.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { PERMISSIONS } from '../../../common/constants/permissions.constants';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';

/**
 * Controller that exposes REST endpoints for managing stock movement records (movimientos).
 * All routes require JWT authentication and permission-based authorization.
 *
 * @class MovimientoController
 */
@ApiTags('movimientos')
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('movimientos')
export class MovimientoController {
  /**
   * Creates an instance of MovimientoController.
   *
   * @param {MovimientoService} movimientoService - Service handling movimiento business logic.
   */
  constructor(private readonly movimientoService: MovimientoService) {}

  /**
   * Creates a new stock movement record manually.
   * Restricted to users with stock adjustment permissions.
   *
   * @param {CreateMovimientoDto} dto - Body containing the movement type, quantity, and inventory reference.
   * @returns The created movimiento entity.
   * @throws {BadRequestException} When the DTO fails validation.
   * @example
   * POST /movimientos
   */
  @Post()
  @RequirePermissions(PERMISSIONS.inventario.ajustar_stock)
  @ApiOperation({
    summary: 'Crear un nuevo movimiento',
    description: 'docs.SOLO_ADMIN_Y_PROFESORES_PUEDEN',
  })
  @ApiResponse({
    status: 201,
    description: 'docs.MOVIMIENTO_CREADO_EXITOSAMENTE',
  })
  @ApiResponse({
    status: 400,
    description: 'docs.DATOS_INV_LIDOS',
  })
  @ApiResponse({
    status: 403,
    description: 'docs.ACCESO_DENEGADO_ROL_INSUFICIENTE',
  })
  create(@Body() dto: CreateMovimientoDto) {
    return this.movimientoService.create(dto);
  }

  /**
   * Returns a paginated and filtered list of all stock movements.
   *
   * @param {MovimientoListQueryDto} query - Pagination, sorting, and filter parameters.
   * @returns {Promise<PaginatedResponseDto<any>>} Paginated collection of movimientos.
   * @example
   * GET /movimientos?page=1&limit=20&sortBy=createdAt&order=DESC
   */
  @Get()
  @RequirePermissions(PERMISSIONS.movimientos.listar)
  @ApiOperation({
    summary: 'Listar todos los movimientos',
    description: 'docs.RETORNA_TODOS_LOS_MOVIMIENTOS_ORDENADOS',
  })
  @ApiResponse({
    status: 200,
    description: 'docs.LISTA_DE_MOVIMIENTOS_PAGINADA',
  })
  findAll(
    @SortableFields(
      ['tipo', 'cantidad', 'entidad', 'createdAt'],
      MovimientoListQueryDto
    )
    query: MovimientoListQueryDto
  ): Promise<PaginatedResponseDto<any>> {
    return this.movimientoService.findAll(query);
  }

  /**
   * Returns a paginated traceability history of stock movements filtered by product-supplier or user.
   * At least one of entityId or userId must be provided.
   *
   * @param {MovimientoHistoryDto} dto - Query parameters: entityId, userId, type, startDate, endDate, sortBy, sortOrder.
   * @returns {Promise<PaginatedResponseDto<Movimiento>>} Paginated and chronologically ordered movement history.
   * @throws {BadRequestException} When neither entityId nor userId is provided, or when date range is invalid.
   * @throws {NotFoundException} When no movements match the specified criteria.
   * @example
   * GET /movimientos/historial?entityId=019c9b4f-74f8-7a6e-8b5b-96191c30c1e5
   */
  @Get('historial')
  @RequirePermissions(PERMISSIONS.movimientos.listar)
  @ApiOperation({
    summary: 'Obtener historial de movimientos (Trazabilidad)',
    description: 'docs.BUSCA_EL_HISTORIAL_DE_MOVIMIENTOS_DE_UN',
  })
  @ApiQuery({
    name: 'entityId',
    required: false,
    type: 'string',
    description: 'docs.UUID_DEL_PRODUCTOPROVEEDOR_PARA_FILTRAR',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: 'string',
    description: 'docs.UUID_DEL_USUARIO_PARA_FILTRAR_MOVIMIENTO',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    type: 'string',
    enum: ['entrada', 'salida', 'ajuste', 'pedido', 'entrada_compra'],
    description: 'docs.TIPO_DE_MOVIMIENTO_A_FILTRAR',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: 'string',
    description: 'docs.FECHA_DE_INICIO_ISO_8601_EJ_2026_01_01',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: 'string',
    description: 'docs.FECHA_DE_FIN_ISO_8601_EJ_2026_02_28',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['createdAt', 'cantidad'],
    description: 'docs.CAMPO_POR_EL_QUE_ORDENAR',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'docs.ORDEN_DE_CLASIFICACI_N_ASCENDENTE_O_DESC',
  })
  @ApiResponse({
    status: 200,
    description: 'docs.HISTORIAL_DE_MOVIMIENTOS_ENCONTRADO_ORDE',
  })
  @ApiResponse({
    status: 400,
    description: 'docs.PAR_METROS_INV_LIDOS_O_NO_PROPORCIONA_EN',
  })
  @ApiResponse({
    status: 403,
    description: 'docs.ACCESO_DENEGADO_ROL_INSUFICIENTE',
  })
  @ApiResponse({
    status: 404,
    description: 'docs.NO_SE_ENCONTRARON_MOVIMIENTOS_QUE_COINCI',
  })
  getMovimientoHistory(
    @Query() dto: MovimientoHistoryDto
  ): Promise<PaginatedResponseDto<Movimiento>> {
    return this.movimientoService.getMovimientoHistory(dto);
  }

  /**
   * Retrieves a single stock movement by its UUID.
   *
   * @param {string} id - UUID of the movimiento to retrieve.
   * @returns The found movimiento entity.
   * @throws {NotFoundException} When no movimiento exists with the given ID.
   * @example
   * GET /movimientos/:id
   */
  @Get(':id')
  @RequirePermissions(PERMISSIONS.movimientos.listar)
  @ApiOperation({
    summary: 'Obtener un movimiento por ID',
    description: 'docs.RETORNA_LOS_DETALLES_COMPLETOS_DE_UN_MOV',
  })
  @ApiResponse({
    status: 200,
    description: 'docs.MOVIMIENTO_ENCONTRADO',
  })
  @ApiResponse({
    status: 404,
    description: 'docs.MOVIMIENTO_NO_ENCONTRADO',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.movimientoService.findOne(id);
  }

  /**
   * Updates an existing stock movement record.
   * Restricted to users with stock adjustment permissions.
   *
   * @param {string} id - UUID of the movimiento to update.
   * @param {UpdateMovimientoDto} dto - Partial data to update on the movimiento.
   * @returns The updated movimiento entity.
   * @throws {NotFoundException} When no movimiento exists with the given ID.
   * @throws {BadRequestException} When the DTO fails validation.
   * @example
   * PATCH /movimientos/:id
   */
  @Patch(':id')
  @RequirePermissions(PERMISSIONS.inventario.ajustar_stock)
  @ApiOperation({
    summary: 'Actualizar un movimiento',
    description: 'docs.SOLO_ADMIN_PUEDEN_ACTUALIZAR_M',
  })
  @ApiResponse({
    status: 200,
    description: 'docs.MOVIMIENTO_ACTUALIZADO_EXITOSAMENTE',
  })
  @ApiResponse({
    status: 400,
    description: 'docs.DATOS_INV_LIDOS',
  })
  @ApiResponse({
    status: 403,
    description: 'docs.ACCESO_DENEGADO_SOLO_ADMIN',
  })
  @ApiResponse({
    status: 404,
    description: 'docs.MOVIMIENTO_NO_ENCONTRADO',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMovimientoDto
  ) {
    return this.movimientoService.update(id, dto);
  }

  /**
   * Soft-deletes a stock movement record.
   * Restricted to users with stock adjustment permissions.
   *
   * @param {string} id - UUID of the movimiento to remove.
   * @returns {Promise<void>}
   * @throws {NotFoundException} When no movimiento exists with the given ID.
   * @example
   * DELETE /movimientos/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(PERMISSIONS.inventario.ajustar_stock)
  @ApiOperation({
    summary: 'Eliminar un movimiento (soft delete)',
    description: 'docs.SOLO_ADMIN_PUEDEN_ELIMINAR_MOV',
  })
  @ApiResponse({
    status: 204,
    description: 'docs.MOVIMIENTO_ELIMINADO_EXITOSAMENTE',
  })
  @ApiResponse({
    status: 403,
    description: 'docs.ACCESO_DENEGADO_SOLO_ADMIN',
  })
  @ApiResponse({
    status: 404,
    description: 'docs.MOVIMIENTO_NO_ENCONTRADO',
  })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.movimientoService.remove(id);
  }
}

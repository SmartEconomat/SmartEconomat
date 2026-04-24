import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { SortableFields } from '../../../common/decorators/sortable-fields.decorator';
import { ParseUUIDv7Pipe } from '../../../common/pipes';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermisosGuard } from '../../auth/guards/auth-permissions.guard';
import { CreateMermaDto } from '../dto/create-merma.dto';
import { CreateMermaProduccionDto } from '../dto/create-merma-produccion.dto';
import { MermaKpiQueryDto } from '../dto/merma-kpi-query.dto';
import { Merma } from '../merma.entity/merma.entity';
import { MermaKpiResponse, MermaService } from '../service/merma.service';
import { PERMISSIONS } from '../../../common/constants/permissions.constants';

/**
 * Controller that exposes REST endpoints for managing waste (merma) events,
 * including registration, production-linked reporting, KPI aggregation, and listing.
 * All routes require JWT authentication and permission-based authorization.
 *
 * @class MermaController
 */
@ApiTags('Merma')
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('merma')
export class MermaController {
  /**
   * Creates an instance of MermaController.
   *
   * @param {MermaService} mermaService - Service handling merma business logic and inventory deduction.
   */
  constructor(private readonly mermaService: MermaService) {}

  /**
   * Registers a new waste event and deducts the specified quantity from inventory using FEFO ordering.
   *
   * @param {CreateMermaDto} dto - Body containing productoId, cantidad, motivo, and optional metadata.
   * @param {string} userId - ID of the authenticated user extracted from the JWT token.
   * @returns {Promise<Merma>} The created merma record with product and user relations.
   * @throws {NotFoundException} When the referenced product does not exist.
   * @throws {BadRequestException} When there is insufficient stock to cover the requested quantity.
   * @example
   * POST /merma
   */
  @Post()
  @RequirePermissions(PERMISSIONS.merma.crear)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar una merma y descontar stock del inventario',
  })
  @ApiResponse({ status: 201, type: Merma })
  @ApiResponse({
    status: 400,
    description: 'Stock insuficiente o datos inválidos',
  })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  create(
    @Body() dto: CreateMermaDto,
    @GetUser('id') userId: string
  ): Promise<Merma> {
    return this.mermaService.create(dto, userId);
  }

  /**
   * Registers a waste event linked to a specific production batch ingredient.
   * Validates that the product is part of the batch's recipe before recording.
   *
   * @param {CreateMermaProduccionDto} dto - Body containing produccionLoteId, productoId, cantidad, and optional metadata.
   * @param {string} userId - ID of the authenticated user extracted from the JWT token.
   * @returns {Promise<Merma>} The created merma record with product and user relations.
   * @throws {NotFoundException} When the production batch does not exist.
   * @throws {BadRequestException} When the product is not an ingredient of the batch's recipe,
   *   or when there is insufficient stock.
   * @example
   * POST /merma/produccion/reportar
   */
  @Post('produccion/reportar')
  @RequirePermissions(PERMISSIONS.merma.crear)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Registrar merma de ingrediente desde un lote de producción sin modificar estados históricos',
  })
  @ApiResponse({ status: 201, type: Merma })
  @ApiResponse({
    status: 400,
    description: 'Ingrediente inválido para el lote',
  })
  @ApiResponse({ status: 404, description: 'Lote de producción no encontrado' })
  createFromProduccion(
    @Body() dto: CreateMermaProduccionDto,
    @GetUser('id') userId: string
  ): Promise<Merma> {
    return this.mermaService.createFromProduccion(dto, userId);
  }

  /**
   * Returns aggregated KPI metrics for waste events, optionally filtered by date range and product.
   *
   * @param {MermaKpiQueryDto} query - Optional query filters: startDate, endDate, productoId.
   * @returns {Promise<MermaKpiResponse>} Aggregated waste KPI data including percentage and breakdowns.
   * @throws {BadRequestException} When date parameters are invalid or startDate is after endDate.
   * @example
   * GET /merma/kpis?startDate=2026-01-01&endDate=2026-03-31
   */
  @Get('kpis')
  @RequirePermissions(PERMISSIONS.merma.stats)
  @ApiOperation({
    summary:
      'Obtener KPIs de merma (cantidad perdida, referencia y porcentaje) con filtros temporales',
  })
  @ApiResponse({ status: 200 })
  getKpis(@Query() query: MermaKpiQueryDto): Promise<MermaKpiResponse> {
    return this.mermaService.getKpis(query);
  }

  /**
   * Returns summary statistics for waste records grouped by reason (motivo) and by product.
   *
   * @returns {Promise<{ porMotivo: unknown[]; porProducto: unknown[] }>} Aggregated waste stats.
   * @example
   * GET /merma/stats
   */
  @Get('stats')
  @RequirePermissions(PERMISSIONS.merma.stats)
  @ApiOperation({
    summary: 'Obtener estadísticas de merma por motivo y producto',
  })
  @ApiResponse({ status: 200 })
  getStats(): Promise<{ porMotivo: unknown[]; porProducto: unknown[] }> {
    return this.mermaService.getStats();
  }

  /**
   * Returns a paginated list of all waste records.
   *
   * @param {PaginationQueryDto} query - Pagination and sorting parameters.
   * @returns {Promise<PaginatedResponseDto<Merma>>} Paginated collection of merma records.
   * @example
   * GET /merma?page=1&limit=20&sortBy=createdAt&order=DESC
   */
  @Get()
  @RequirePermissions(PERMISSIONS.merma.listar)
  @ApiOperation({ summary: 'Listar todas las mermas con paginación' })
  @ApiResponse({ status: 200, type: [Merma] })
  findAll(
    @SortableFields(['createdAt', 'cantidad', 'motivo'])
    query: PaginationQueryDto
  ): Promise<PaginatedResponseDto<Merma>> {
    return this.mermaService.findAll(query);
  }

  /**
   * Retrieves a single waste record by its UUID.
   *
   * @param {string} id - UUID v7 of the merma to retrieve.
   * @returns {Promise<Merma>} The found merma with product and user relations loaded.
   * @throws {NotFoundException} When no merma exists with the given ID.
   * @example
   * GET /merma/:id
   */
  @Get(':id')
  @RequirePermissions(PERMISSIONS.merma.ver)
  @ApiOperation({ summary: 'Obtener una merma por ID' })
  @ApiParam({ name: 'id', description: 'UUID v7 de la merma' })
  @ApiResponse({ status: 200, type: Merma })
  @ApiResponse({ status: 404, description: 'Merma no encontrada' })
  findOne(@Param('id', ParseUUIDv7Pipe) id: string): Promise<Merma> {
    return this.mermaService.findOne(id);
  }
}

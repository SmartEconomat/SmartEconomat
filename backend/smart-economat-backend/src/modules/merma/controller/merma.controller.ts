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
import { validateDateRange } from '../../../common/utils/date-range.util';
import { SORTABLE_FIELDS } from '../../../common/constants/sortable-fields.constants';

/**
 * Controlador para la gestión de mermas y desperdicios.
 * Permite registrar mermas manuales, mermas derivadas de la producción
 * y consultar indicadores de rendimiento (KPIs).
 */
@ApiTags('Merma')
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('merma')
export class MermaController {
  /**
   * Crea una instancia de MermaController.
   * @param mermaService Servicio para la gestión lógica de mermas.
   */
  constructor(private readonly mermaService: MermaService) {}

  /**
   * Registra una nueva merma manual, descontando automáticamente el stock del inventario.
   * @param dto Datos de la merma (producto, cantidad, motivo).
   * @param userId ID del usuario que registra la merma.
   * @returns El registro de merma creado.
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
   * Registra una merma de ingrediente ocurrida durante un proceso de producción.
   * @param dto Datos de la merma vinculada a un lote de producción.
   * @param userId ID del usuario que reporta la merma.
   * @returns El registro de merma creado.
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
   * Recupera los indicadores clave de rendimiento (KPIs) sobre las mermas.
   * @param query Filtros de fecha y categoría para los KPIs.
   * @returns Objeto con métricas de pérdida y porcentaje.
   */
  @Get('kpis')
  @RequirePermissions(PERMISSIONS.merma.stats)
  @ApiOperation({
    summary:
      'Obtener KPIs de merma (cantidad perdida, referencia y porcentaje) con filtros temporales',
  })
  @ApiResponse({ status: 200 })
  getKpis(@Query() query: MermaKpiQueryDto): Promise<MermaKpiResponse> {
    validateDateRange(query.startDate, query.endDate, 365, 'Mermas');
    return this.mermaService.getKpis(query);
  }

  /**
   * Obtiene estadísticas agregadas de mermas por motivo y por producto.
   * @returns Agregaciones para visualización en dashboards.
   */
  /**
   * Obtiene valores o vistas materializadas.
   * @undefined {Promise<{ porMotivo: unknown[]; porProducto: unknown[]; }>} Datos efectivos después de ejecutar la operación.
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
   * Lista todas las mermas registradas con soporte para paginación.
   * @param query Parámetros de paginación y ordenación.
   * @returns Lista paginada de mermas.
   */
  @Get()
  @RequirePermissions(PERMISSIONS.merma.listar)
  @ApiOperation({ summary: 'Listar todas las mermas con paginación' })
  @ApiResponse({ status: 200, type: [Merma] })
  findAll(
    @SortableFields(SORTABLE_FIELDS.mermas)
    query: PaginationQueryDto
  ): Promise<PaginatedResponseDto<Merma>> {
    return this.mermaService.findAll(query);
  }

  /**
   * Obtiene el detalle de una merma específica por su ID.
   * @param id UUID de la merma.
   * @returns El registro de merma solicitado.
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

import { ValidarProduccionDto } from '../dto/validar-produccion.dto';
import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Patch,
  Query,
} from '@nestjs/common';
import { ParseUUIDv7Pipe } from '../../../common/pipes/parse-uuid-v7.pipe';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { ProduccionService } from '../service/produccion.service';
import { EjecutarProduccionDto } from '../dto/ejecutar-produccion.dto';
import { ProduccionLote } from '../produccion-lote.entity/produccion-lote.entity';
import { ConsumirProduccionDto } from '../dto/consumir-produccion.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { SortableFields } from '../../../common/decorators/sortable-fields.decorator';
import { PermisosGuard } from '../../auth/guards/auth-permissions.guard';
import { PERMISSIONS } from '../../../common/constants/permissions.constants';
import { SORTABLE_FIELDS } from '../../../common/constants/sortable-fields.constants';

/** Clase pública (ProduccionController). Paquete: smart-economat-backend (Nest). */
@ApiTags('Producción')
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('produccion')
export class ProduccionController {
  /**
   * Construye la instancia configurada.
   * @undefined {ProduccionService} produccionService - Entrada efectiva esperada por el contrato.
   */
  constructor(private readonly produccionService: ProduccionService) {}

  /**
   * Expone "ejecutarProduccion" en smart-economat-backend (Nest).
   * @undefined {EjecutarProduccionDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {string} userId - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<ProduccionLote>} Datos efectivos después de ejecutar la operación.
   */
  @Post('ejecutar')
  @RequirePermissions(PERMISSIONS.recetas.cocinar)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Ejecutar la producción de una receta y registrar el lote',
  })
  @ApiResponse({ status: 201, type: ProduccionLote })
  @ApiResponse({
    status: 400,
    description: 'docs.STOCK_INSUFICIENTE_OR_RECETA_INV_LIDA',
  })
  @ApiResponse({ status: 404, description: 'docs.RECETA_NO_ENCONTRADA' })
  ejecutarProduccion(
    @Body() dto: EjecutarProduccionDto,
    @GetUser('id') userId: string
  ): Promise<ProduccionLote> {
    return this.produccionService.ejecutarProduccion(dto, userId);
  }

  /**
   * Expone "validarStock" en smart-economat-backend (Nest).
   * @undefined {ValidarProduccionDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<{ ingredients: { productoId: any; nombre: string; requerido: number; disponible: number; unidad: string; isEnough: boolean; cheapestProveedorId: string; cheapestProveedorNombre: string; cheapestProductoProveedorId: string; cheapestPrecio: number | undefined; isFavorite: boolean; }[]; }>} Datos efectivos después de ejecutar la operación.
   */
  @Post('validar')
  @RequirePermissions(PERMISSIONS.recetas.cocinar)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validar stock disponible para una o varias producciones',
  })
  validarStock(@Body() dto: ValidarProduccionDto) {
    return this.produccionService.validarMultiple(dto);
  }

  /**
   * Expone "findAll" en smart-economat-backend (Nest).
   * @undefined {PaginationQueryDto} query - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<PaginatedResponseDto<ProduccionLote>>} Datos efectivos después de ejecutar la operación.
   */
  @Get()
  @RequirePermissions(PERMISSIONS.recetas.listar)
  @ApiOperation({ summary: 'Listar todos los lotes de producción' })
  @ApiResponse({ status: 200, type: [ProduccionLote] })
  findAll(
    @SortableFields(SORTABLE_FIELDS.produccion)
    @Query()
    query: PaginationQueryDto
  ): Promise<PaginatedResponseDto<ProduccionLote>> {
    return this.produccionService.findAll(query);
  }

  /**
   * Expone "consumirPorciones" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {ConsumirProduccionDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {string} userId - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<ProduccionLote>} Datos efectivos después de ejecutar la operación.
   */
  @Patch('lote/:id/consumir')
  @RequirePermissions(PERMISSIONS.recetas.cocinar)
  @ApiOperation({
    summary: 'Consumir raciones o cantidad de un lote de producción',
  })
  @ApiResponse({ status: 200, type: ProduccionLote })
  consumirPorciones(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Body() dto: ConsumirProduccionDto,
    @GetUser('id') userId: string
  ): Promise<ProduccionLote> {
    return this.produccionService.consumirPorciones(id, dto, userId);
  }

  /**
   * Expone "findOne" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<ProduccionLote>} Datos efectivos después de ejecutar la operación.
   */
  @Get(':id')
  @RequirePermissions(PERMISSIONS.recetas.ver)
  @ApiOperation({ summary: 'Obtener un lote de producción por ID' })
  @ApiParam({ name: 'id', description: 'docs.UUID_DEL_LOTE_DE_PRODUCCI_N' })
  @ApiResponse({ status: 200, type: ProduccionLote })
  @ApiResponse({ status: 404, description: 'docs.LOTE_NO_ENCONTRADO' })
  findOne(@Param('id', ParseUUIDv7Pipe) id: string): Promise<ProduccionLote> {
    return this.produccionService.findOne(id);
  }
}

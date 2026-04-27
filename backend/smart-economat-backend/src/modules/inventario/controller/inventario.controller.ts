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
 * Documentación en español.
 */
@ApiTags('Inventario')
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('inventario')
export class InventarioController {
  constructor(private readonly inventarioService: InventarioService) {}

  /**
   * Documentación en español.
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
   * Documentación en español.
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
   * Documentación en español.
   */
  @Get('stock')
  @RequirePermissions(PERMISSIONS.inventario.listar)
  queryStock(
    @Query() dto: InventoryQueryDto
  ): Promise<StockPorUbicacionDto[] | StockConsolidadoDto[]> {
    return this.inventarioService.queryStock(dto);
  }

  /**
   * Documentación en español.
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
   * Documentación en español.
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
   * Documentación en español.
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
   * Documentación en español.
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

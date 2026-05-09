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
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { InventarioListQueryDto } from '../dto/inventario-list-query.dto';
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
import { CrearTransferenciaInventarioDto } from '../dto/crear-transferencia-inventario.dto';
import { Transferencia } from '../transferencia.entity/transferencia.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { SortableFields } from '../../../common/decorators/sortable-fields.decorator';
import { PermisosGuard } from '../../auth/guards/auth-permissions.guard';
import { PERMISSIONS } from '../../../common/constants/permissions.constants';
import { SORTABLE_FIELDS } from '../../../common/constants/sortable-fields.constants';

/**
 * Controlador para la gestión de inventario y stock físico.
 * Permite realizar ajustes manuales, consultar niveles de stock por ubicación y gestionar alertas.
 */
@ApiTags('Inventario')
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('inventario')
export class InventarioController {
  /**
   * Crea una instancia de InventarioController.
   * @param inventarioService Servicio para la gestión lógica del inventario.
   */
  constructor(private readonly inventarioService: InventarioService) {}

  /**
   * Registra manualmente una nueva entrada en el inventario para un producto-proveedor.
   * @param createInventarioDto Datos de la nueva entrada.
   * @param userId ID del usuario que registra la entrada.
   * @returns El registro de inventario creado.
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
   * Obtiene la lista paginada de registros de inventario.
   * @param query Parámetros de paginación y ordenación.
   * @param userRole Rol del usuario para control de visibilidad.
   * @returns Respuesta paginada con los registros de inventario.
   */
  @Get()
  @RequirePermissions(PERMISSIONS.inventario.listar)
  findAll(
    @SortableFields(SORTABLE_FIELDS.inventario, InventarioListQueryDto)
    query: InventarioListQueryDto,
    @GetUser('rol') userRole: string
  ): Promise<PaginatedResponseDto<Inventario>> {
    return this.inventarioService.findAll(query, userRole);
  }

  /**
   * Consulta el stock disponible aplicando filtros de ubicación y producto.
   * @param dto Filtros de consulta de stock.
   * @returns Lista de stock consolidado o desglosado por ubicación.
   */
  @Get('stock')
  @RequirePermissions(PERMISSIONS.inventario.listar)
  queryStock(
    @Query() dto: InventoryQueryDto
  ): Promise<StockPorUbicacionDto[] | StockConsolidadoDto[]> {
    return this.inventarioService.queryStock(dto);
  }

  /**
   * Realiza un ajuste manual de stock (entrada, salida o ajuste) con auditoría.
   * @param dto Datos del ajuste manual.
   * @param userId ID del usuario responsable del ajuste.
   * @returns El registro de inventario actualizado.
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
   * Transfiere cantidades formales entre ubicaciones (cabecera + líneas + movimiento).
   */
  @Post('transferencias')
  @RequirePermissions(PERMISSIONS.inventario.transferir)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Transferir stock entre ubicaciones con trazabilidad',
  })
  @ApiBody({ type: CrearTransferenciaInventarioDto })
  @ApiResponse({
    status: 201,
    description: 'Transferencia completada',
    type: Transferencia,
  })
  ejecutarTransferencia(
    @Body() dto: CrearTransferenciaInventarioDto,
    @GetUser('id') userId: string,
    @GetUser('rol') userRol: string
  ): Promise<Transferencia> {
    return this.inventarioService.ejecutarTransferenciaUbicaciones(
      dto,
      userId,
      userRol
    );
  }

  /**
   * Obtiene el detalle de un registro de inventario por su ID.
   * @param id UUID del registro de inventario.
   * @param userRole Rol del usuario solicitante.
   * @returns El registro de inventario solicitado.
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
   * Actualiza los metadatos de un registro de inventario (fechas, cantidades mín/máx).
   * @param id UUID del registro a actualizar.
   * @param updateInventarioDto Nuevos datos.
   * @param userId ID del usuario que realiza la actualización.
   * @returns El registro actualizado.
   */
  @Patch(':id')
  @RequirePermissions(PERMISSIONS.inventario.editar)
  update(
    @Param('id') id: string,
    @Body() updateInventarioDto: UpdateInventarioDto,
    @GetUser('id') userId: string,
    @GetUser('rol') userRol: string
  ): Promise<Inventario> {
    return this.inventarioService.update(
      id,
      updateInventarioDto,
      userId,
      userRol
    );
  }

  /**
   * Elimina lógicamente un registro de inventario.
   * @param id UUID del registro a eliminar.
   * @param userId ID del usuario que realiza la eliminación.
   */
  /**
   * Expone "remove" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {string} userId - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
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

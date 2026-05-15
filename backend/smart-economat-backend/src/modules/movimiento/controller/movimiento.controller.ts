import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Req,
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
import { validateDateRange } from '../../../common/utils/date-range.util';
import { SORTABLE_FIELDS } from '../../../common/constants/sortable-fields.constants';

/**
 * Controlador para la consulta y gestión de movimientos de stock.
 * Proporciona trazabilidad completa de todas las entradas, salidas y ajustes del inventario,
 * permitiendo filtrar por usuario, producto, rango de fechas y tipo de operación.
 */
@ApiTags('movimientos')
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('movimientos')
export class MovimientoController {
  /**
   * Crea una instancia de MovimientoController.
   * @param movimientoService Servicio para la gestión lógica de movimientos.
   */
  constructor(private readonly movimientoService: MovimientoService) {}

  /**
   * Crea un nuevo registro de movimiento de stock.
   * @param dto Datos del movimiento (tipo, cantidad, entidad vinculada).
   * @returns El movimiento creado.
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
  create(
    @Body() dto: CreateMovimientoDto,
    @Req() req: { user: { id: string } }
  ) {
    dto.usuario = req.user.id;
    return this.movimientoService.create(dto);
  }

  /**
   * Lista todos los movimientos registrados con soporte para paginación y ordenación dinámica.
   * @param query Parámetros de consulta (página, límite, sortBy, order).
   * @returns Lista paginada de movimientos.
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
    @SortableFields(SORTABLE_FIELDS.movimientos, MovimientoListQueryDto)
    query: MovimientoListQueryDto
  ): Promise<PaginatedResponseDto<any>> {
    validateDateRange(query.startDate, query.endDate, 365, 'Movimientos');
    return this.movimientoService.findAll(query);
  }

  /**
   * Recupera el historial detallado de movimientos (Trazabilidad) con filtros avanzados.
   * @param dto Filtros de búsqueda (entidad, usuario, rango temporal, tipo).
   * @returns Lista de movimientos que coinciden con los criterios.
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
    name: 'order',
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
    @SortableFields(SORTABLE_FIELDS.movimientoHistorial, MovimientoHistoryDto)
    dto: MovimientoHistoryDto
  ): Promise<PaginatedResponseDto<Movimiento>> {
    validateDateRange(
      dto.startDate,
      dto.endDate,
      365,
      'Historial de Movimientos'
    );
    return this.movimientoService.getMovimientoHistory(dto);
  }

  /**
   * Obtiene el detalle de un movimiento específico por su ID.
   * @param id UUID del movimiento.
   * @returns El movimiento encontrado.
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
   * Actualiza los datos de un movimiento existente (solo campos auditables).
   * @param id UUID del movimiento.
   * @param dto Nuevos datos.
   * @returns El movimiento actualizado.
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
   * Elimina un registro de movimiento (eliminación lógica).
   * @param id UUID del movimiento.
   */
  /**
   * Expone "remove" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
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

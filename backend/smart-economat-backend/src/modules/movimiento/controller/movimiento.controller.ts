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
 * Documentación en español.
 */
@ApiTags('movimientos')
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('movimientos')
export class MovimientoController {
        /**
     * Documentación en español.
     */
  constructor(private readonly movimientoService: MovimientoService) {}

        /**
     * Documentación en español.
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
     * Documentación en español.
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
     * Documentación en español.
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
     * Documentación en español.
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
     * Documentación en español.
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
     * Documentación en español.
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

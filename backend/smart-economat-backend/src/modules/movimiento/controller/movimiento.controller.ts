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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ParseUUIDv7Pipe } from '../../../common/pipes';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SortableFields } from '../../../common/decorators/sortable-fields.decorator';
import { MovimientoService } from '../service/movimiento.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { CreateMovimientoDto } from '../dto/create-movimiento.dto';
import { UpdateMovimientoDto } from '../dto/update-movimiento.dto';
import { MovimientoHistoryDto } from '../dto/movimiento-history.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { PermisosGuard } from '../../authorization/guards/permisos.guard';

@ApiTags('movimientos')
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('movimientos')
export class MovimientoController {
  constructor(private readonly movimientoService: MovimientoService) {}

  @Post()
  @RequirePermissions('movimientos:crear')
  @ApiOperation({
    summary: 'Crear un nuevo movimiento',
    description: 'Solo usuarios con permiso pueden crear movimientos',
  })
  @ApiResponse({
    status: 201,
    description: 'Movimiento creado exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos',
  })
  create(@Body() dto: CreateMovimientoDto) {
    return this.movimientoService.create(dto);
  }

  @Get()
  @RequirePermissions('movimientos:listar')
  @ApiOperation({
    summary: 'Listar todos los movimientos',
    description:
      'Retorna todos los movimientos ordenados por fecha descendente',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de movimientos paginada',
  })
  findAll(
    @SortableFields(['tipo', 'cantidad', 'entidad', 'createdAt'])
    query: PaginationQueryDto
  ): Promise<PaginatedResponseDto<any>> {
    return this.movimientoService.findAll(query);
  }

  @Get('historial')
  @RequirePermissions('movimientos:historial')
  @ApiOperation({
    summary: 'Obtener historial de movimientos (Trazabilidad)',
    description:
      'Busca el historial de movimientos de un producto o usuario. Soporta filtros por tipo, rango de fechas y ordenamiento.',
  })
  @ApiQuery({
    name: 'entityId',
    required: false,
    type: 'string',
    description: 'UUID del ProductoProveedor para filtrar movimientos',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: 'string',
    description: 'UUID del Usuario para filtrar movimientos',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    type: 'string',
    enum: ['entrada', 'salida', 'ajuste', 'pedido', 'entrada_compra'],
    description: 'Tipo de movimiento a filtrar',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: 'string',
    description: 'Fecha de inicio (ISO 8601) - ej: 2026-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: 'string',
    description: 'Fecha de fin (ISO 8601) - ej: 2026-02-28',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['createdAt', 'cantidad'],
    description: 'Campo por el que ordenar',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Orden de clasificación (Ascendente o Descendente)',
  })
  @ApiResponse({
    status: 200,
    description:
      'Historial de movimientos encontrado (ordenado cronológicamente inverso)',
  })
  @ApiResponse({
    status: 400,
    description: 'Parámetros inválidos o no proporciona entityId ni userId',
  })
  @ApiResponse({
    status: 404,
    description:
      'No se encontraron movimientos que coincidan con los criterios',
  })
  getMovimientoHistory(@Query() dto: MovimientoHistoryDto) {
    return this.movimientoService.getMovimientoHistory(dto);
  }

  @Get(':id')
  @RequirePermissions('movimientos:ver')
  @ApiOperation({
    summary: 'Obtener un movimiento por ID',
    description: 'Retorna los detalles completos de un movimiento específico',
  })
  @ApiResponse({
    status: 200,
    description: 'Movimiento encontrado',
  })
  @ApiResponse({
    status: 404,
    description: 'Movimiento no encontrado',
  })
  findOne(@Param('id', ParseUUIDv7Pipe) id: string) {
    return this.movimientoService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('movimientos:editar')
  @ApiOperation({
    summary: 'Actualizar un movimiento',
    description: 'Solo usuarios con permiso pueden actualizar movimientos',
  })
  @ApiResponse({
    status: 200,
    description: 'Movimiento actualizado exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos',
  })
  @ApiResponse({
    status: 404,
    description: 'Movimiento no encontrado',
  })
  update(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Body() dto: UpdateMovimientoDto
  ) {
    return this.movimientoService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('movimientos:eliminar')
  @ApiOperation({
    summary: 'Eliminar un movimiento (soft delete)',
    description: 'Solo usuarios con permiso pueden eliminar movimientos',
  })
  @ApiResponse({
    status: 204,
    description: 'Movimiento eliminado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Movimiento no encontrado',
  })
  remove(@Param('id', ParseUUIDv7Pipe) id: string) {
    return this.movimientoService.remove(id);
  }
}

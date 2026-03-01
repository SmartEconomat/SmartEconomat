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
import { MovimientoService } from '../service/movimiento.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { CreateMovimientoDto } from '../dto/create-movimiento.dto';
import { UpdateMovimientoDto } from '../dto/update-movimiento.dto';
import { MovimientoHistoryDto } from '../dto/movimiento-history.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/role.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { rolUsuario } from '../../usuario/enums/usuario.enums';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';

@ApiTags('movimientos')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('movimientos')
export class MovimientoController {
  constructor(private readonly movimientoService: MovimientoService) {}

  @Post()
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
  @ApiOperation({
    summary: 'Crear un nuevo movimiento',
    description: 'Solo administradores y profesores pueden crear movimientos',
  })
  @ApiResponse({
    status: 201,
    description: 'Movimiento creado exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado - Rol insuficiente',
  })
  create(@Body() dto: CreateMovimientoDto) {
    return this.movimientoService.create(dto);
  }

  @Get()
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR, rolUsuario.ALUMNO)
  @ApiOperation({
    summary: 'Listar todos los movimientos',
    description:
      'Retorna todos los movimientos ordenados por fecha descendente',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Lista de movimientos paginada',
  })
  findAll(
    @Query() query: PaginationQueryDto
  ): Promise<PaginatedResponseDto<any>> {
    return this.movimientoService.findAll(query);
  }

  @Get('historial')
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
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
    status: 403,
    description: 'Acceso denegado - Rol insuficiente',
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
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR, rolUsuario.ALUMNO)
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
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.movimientoService.findOne(id);
  }

  @Patch(':id')
  @Roles(rolUsuario.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Actualizar un movimiento',
    description: 'Solo administradores pueden actualizar movimientos',
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
    status: 403,
    description: 'Acceso denegado - Solo administradores',
  })
  @ApiResponse({
    status: 404,
    description: 'Movimiento no encontrado',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMovimientoDto
  ) {
    return this.movimientoService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(rolUsuario.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Eliminar un movimiento (soft delete)',
    description: 'Solo administradores pueden eliminar movimientos',
  })
  @ApiResponse({
    status: 204,
    description: 'Movimiento eliminado exitosamente',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado - Solo administradores',
  })
  @ApiResponse({
    status: 404,
    description: 'Movimiento no encontrado',
  })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.movimientoService.remove(id);
  }
}

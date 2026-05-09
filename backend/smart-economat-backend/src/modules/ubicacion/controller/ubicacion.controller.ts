import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { ParseUUIDv7Pipe } from '../../../common/pipes';
import { UbicacionService } from '../service/ubicacion.service';
import { CreateUbicacionDto } from '../dto/create-ubicacion.dto';
import { UpdateUbicacionDto } from '../dto/update-ubicacion.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { PermisosGuard } from '../../auth/guards/auth-permissions.guard';
import { BaseController } from '../../../common/base/base.controller';
import { Ubicacion } from '../ubicacion.entity/ubicacion.entity';
import { PERMISSIONS } from '../../../common/constants/permissions.constants';

/**
 * Controlador REST para ubicacion.
 */
@ApiTags('Ubicaciones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('ubicacion')
export class UbicacionController extends BaseController<
  Ubicacion,
  CreateUbicacionDto,
  UpdateUbicacionDto,
  UbicacionService
> {
  /**
   * Inicializa la instancia con los colaboradores necesarios para el flujo.
   *
   * @param service Parámetro de entrada para la operación.
   */
  constructor(service: UbicacionService) {
    super(service);
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Crea recursos nuevos en base a las reglas de negocio.
   * @undefined {CreateUbicacionDto} createUbicacionDto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<Ubicacion>} Datos efectivos después de ejecutar la operación.
   */
  @Post()
  @RequirePermissions(PERMISSIONS.ubicaciones.crear)
  @ApiOperation({ summary: 'Crear nueva ubicación' })
  override create(@Body() createUbicacionDto: CreateUbicacionDto) {
    return super.create(createUbicacionDto);
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "findAll" en smart-economat-backend (Nest).
   * @undefined {PaginationQueryDto} query - Entrada efectiva esperada por el contrato.
   * @undefined {{ user?: { rol?: string; }; }} req - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/common/dto/paginated-response.dto").PaginatedResponseDto<Ubicacion>>} Datos efectivos después de ejecutar la operación.
   */
  @Get()
  @RequirePermissions(PERMISSIONS.ubicaciones.listar)
  @ApiOperation({ summary: 'Obtener todas las ubicaciones' })
  override findAll(
    @Query() query: PaginationQueryDto,
    @Req() req: { user?: { rol?: string } }
  ) {
    return super.findAll(query, req);
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "findOne" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {{ user?: { rol?: string; }; }} req - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<Ubicacion>} Datos efectivos después de ejecutar la operación.
   */
  @Get(':id')
  @RequirePermissions(PERMISSIONS.ubicaciones.ver)
  @ApiOperation({ summary: 'Obtener ubicación por ID' })
  override findOne(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Req() req: { user?: { rol?: string } }
  ) {
    return super.findOne(id, req);
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Persiste modificaciones válidas sobre entidades existentes.
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {UpdateUbicacionDto} updateUbicacionDto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<Ubicacion>} Datos efectivos después de ejecutar la operación.
   */
  @Patch(':id')
  @RequirePermissions(PERMISSIONS.ubicaciones.editar)
  @ApiOperation({ summary: 'Actualizar una ubicación' })
  override update(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Body() updateUbicacionDto: UpdateUbicacionDto
  ) {
    return super.update(id, updateUbicacionDto);
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "remove" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
   */
  @Delete(':id')
  @RequirePermissions(PERMISSIONS.ubicaciones.eliminar)
  @ApiOperation({ summary: 'Eliminar una ubicación lógica' })
  override remove(@Param('id', ParseUUIDv7Pipe) id: string) {
    return super.remove(id);
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "restore" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<Ubicacion>} Datos efectivos después de ejecutar la operación.
   */
  @Post(':id/restore')
  @RequirePermissions(PERMISSIONS.ubicaciones.restaurar)
  @ApiOperation({ summary: 'Restaurar una ubicación eliminada' })
  restore(@Param('id', ParseUUIDv7Pipe) id: string) {
    return this.service.restore(id);
  }
}

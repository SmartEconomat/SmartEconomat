import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermisosGuard } from '../../auth/guards/auth-permissions.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { ParseUUIDv7Pipe } from '../../../common/pipes';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { DistribucionService } from '../service/distribucion.service';
import { CreateDistribucionDto } from '../dto/create-distribucion.dto';
import { CancelDistribucionDto } from '../dto/cancel-distribucion.dto';
import { PERMISSIONS } from '../../../common/constants/permissions.constants';

/**
 * Controlador REST para distribucion.
 */
@ApiTags('Distribuciones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('distribuciones')
export class DistribucionController {
  /**
   * Construye la instancia configurada.
   * @undefined {DistribucionService} distribucionService - Entrada efectiva esperada por el contrato.
   */
  constructor(private readonly distribucionService: DistribucionService) {}

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "findAll" en smart-economat-backend (Nest).
   * @undefined {PaginationQueryDto} query - Entrada efectiva esperada por el contrato.
   * @undefined {{ user?: { rol?: string; }; }} req - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/common/dto/paginated-response.dto").PaginatedResponseDto<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/distribucion/distribucion.entity/distribucion.entity").Distribucion>>} Datos efectivos después de ejecutar la operación.
   */
  @Get()
  @RequirePermissions(PERMISSIONS.distribuciones.listar)
  @ApiOperation({ summary: 'Listar distribuciones' })
  findAll(
    @Query() query: PaginationQueryDto,
    @GetUser('rol') userRole: string
  ) {
    return this.distribucionService.findAll(query, userRole);
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "findDisponibles" en smart-economat-backend (Nest).
   * @undefined {PaginationQueryDto} query - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/distribucion/dto/distribucion-disponible.dto").DistribucionDisponibleDto[]>} Datos efectivos después de ejecutar la operación.
   */
  @Get('disponibles')
  @RequirePermissions(PERMISSIONS.distribuciones.listar)
  @ApiOperation({ summary: 'Listar pedidos de usuario distribuibles' })
  findDisponibles(@Query() query: PaginationQueryDto) {
    return this.distribucionService.findDisponibles(query);
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "findOne" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {{ user?: { rol?: string; }; }} req - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/distribucion/distribucion.entity/distribucion.entity").Distribucion>} Datos efectivos después de ejecutar la operación.
   */
  @Get(':id')
  @RequirePermissions(PERMISSIONS.distribuciones.ver)
  @ApiOperation({ summary: 'Ver detalle de distribución' })
  findOne(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @GetUser('rol') userRole: string
  ) {
    return this.distribucionService.findOne(id, userRole);
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Crea recursos nuevos en base a las reglas de negocio.
   * @undefined {CreateDistribucionDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {string} userId - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/distribucion/distribucion.entity/distribucion.entity").Distribucion>} Datos efectivos después de ejecutar la operación.
   */
  @Post()
  @RequirePermissions(PERMISSIONS.distribuciones.crear)
  @ApiOperation({ summary: 'Preparar una distribución' })
  create(@Body() dto: CreateDistribucionDto, @GetUser('id') userId: string) {
    return this.distribucionService.create(dto, userId);
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "confirmar" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {string} userId - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/distribucion/distribucion.entity/distribucion.entity").Distribucion>} Datos efectivos después de ejecutar la operación.
   */
  @Patch(':id/confirmar')
  @RequirePermissions(PERMISSIONS.distribuciones.confirmar)
  @ApiOperation({ summary: 'Confirmar una distribución y mover stock' })
  confirmar(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @GetUser('id') userId: string
  ) {
    return this.distribucionService.confirmar(id, userId);
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "cancelar" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {CancelDistribucionDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {string} userId - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/distribucion/distribucion.entity/distribucion.entity").Distribucion>} Datos efectivos después de ejecutar la operación.
   */
  @Patch(':id/cancelar')
  @RequirePermissions(PERMISSIONS.distribuciones.cancelar)
  @ApiOperation({ summary: 'Cancelar una distribución no confirmada' })
  cancelar(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Body() dto: CancelDistribucionDto,
    @GetUser('id') userId: string
  ) {
    return this.distribucionService.cancelar(id, dto, userId);
  }
}

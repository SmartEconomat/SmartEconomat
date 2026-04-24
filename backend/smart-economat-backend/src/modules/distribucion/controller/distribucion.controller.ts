import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
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
 * Controller that exposes CRUD and lifecycle-transition endpoints for stock
 * distributions. All routes require JWT authentication and distribution-specific
 * permissions. Role-based visibility is applied by the service layer.
 *
 * @class DistribucionController
 */
@ApiTags('Distribuciones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('distribuciones')
export class DistribucionController {
  constructor(private readonly distribucionService: DistribucionService) {}

  /**
   * Returns a paginated list of distributions.
   * Admin roles can also see soft-deleted records.
   *
   * @param {PaginationQueryDto} query - Pagination, search and estado filter parameters.
   * @param {{ user?: { rol?: string } }} req - Express request with attached JWT user.
   * @returns {Promise<PaginatedResponseDto<Distribucion>>} Paginated distributions.
   */
  @Get()
  @RequirePermissions(PERMISSIONS.distribuciones.listar)
  @ApiOperation({ summary: 'Listar distribuciones' })
  findAll(
    @Query() query: PaginationQueryDto,
    @Req() req: { user?: { rol?: string } }
  ) {
    return this.distribucionService.findAll(query, req.user?.rol);
  }

  /**
   * Returns a paginated list of user orders that are eligible for distribution.
   *
   * @param {PaginationQueryDto} query - Pagination parameters.
   * @returns {Promise<PaginatedResponseDto<DistribucionDisponibleDto>>} Paginated list of distributable orders.
   */
  @Get('disponibles')
  @RequirePermissions(PERMISSIONS.distribuciones.listar)
  @ApiOperation({ summary: 'Listar pedidos de usuario distribuibles' })
  findDisponibles(@Query() query: PaginationQueryDto) {
    return this.distribucionService.findDisponibles(query);
  }

  /**
   * Returns the detail of a single distribution by its ID.
   *
   * @param {string} id - UUID of the distribution to retrieve.
   * @param {{ user?: { rol?: string } }} req - Express request with attached JWT user.
   * @returns {Promise<Distribucion>} The found distribution entity with its relations.
   * @throws {NotFoundException} When no distribution with the given ID exists.
   */
  @Get(':id')
  @RequirePermissions(PERMISSIONS.distribuciones.ver)
  @ApiOperation({ summary: 'Ver detalle de distribución' })
  findOne(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Req() req: { user?: { rol?: string } }
  ) {
    return this.distribucionService.findOne(id, req.user?.rol);
  }

  /**
   * Creates a new distribution in PREPARADA state.
   *
   * @param {CreateDistribucionDto} dto - Payload containing lines, source/destination locations and linked order.
   * @param {string} userId - ID of the authenticated user creating the distribution.
   * @returns {Promise<Distribucion>} The newly created distribution entity.
   * @throws {NotFoundException} When referenced entities (order, locations) are not found.
   * @throws {BadRequestException} When the payload is invalid or stock is insufficient.
   */
  @Post()
  @RequirePermissions(PERMISSIONS.distribuciones.crear)
  @ApiOperation({ summary: 'Preparar una distribución' })
  create(@Body() dto: CreateDistribucionDto, @GetUser('id') userId: string) {
    return this.distribucionService.create(dto, userId);
  }

  /**
   * Confirms a distribution, moving stock from the source to the destination location via FEFO.
   *
   * @param {string} id - UUID of the distribution to confirm.
   * @param {string} userId - ID of the authenticated user performing the action.
   * @returns {Promise<Distribucion>} The updated distribution entity with estado CONFIRMADA.
   * @throws {NotFoundException} When the distribution does not exist.
   * @throws {ConflictException} When the distribution is not in a confirmable state.
   * @throws {BadRequestException} When there is insufficient stock to fulfil the distribution.
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
   * Cancels a distribution that has not yet been confirmed.
   *
   * @param {string} id - UUID of the distribution to cancel.
   * @param {CancelDistribucionDto} dto - DTO containing the cancellation reason.
   * @param {string} userId - ID of the authenticated user performing the action.
   * @returns {Promise<Distribucion>} The updated distribution entity with estado CANCELADA.
   * @throws {NotFoundException} When the distribution does not exist.
   * @throws {ConflictException} When the distribution is already confirmed.
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

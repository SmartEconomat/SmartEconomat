import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PreparacionService } from '../service/preparacion.service';
import { CreatePreparacionDto } from '../dto/create-preparacion.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermisosGuard } from '../../auth/guards/auth-permissions.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { PERMISSIONS } from '../../../common/constants/permissions.constants';
import { I18nHelper } from '../../../common/helpers/i18n.helper';
import type { Request } from 'express';

/**
 * Controller that exposes CRUD and lifecycle-transition endpoints for kitchen
 * preparation orders. All routes require JWT authentication and appropriate
 * recipe-related permissions.
 * @class PreparacionController
 */
@Controller('preparaciones')
@UseGuards(JwtAuthGuard, PermisosGuard)
export class PreparacionController {
  constructor(private readonly preparacionService: PreparacionService) {}

  /**
   * Creates a new preparation order for the authenticated user.
   * @param {CreatePreparacionDto} dto - Payload containing recetaId and production details.
   * @param {Request & { user?: { id?: string } }} req - Express request with authenticated user payload.
   * @returns {Promise<Preparacion>} The newly created preparation entity.
   * @throws {Error} When the request has no authenticated user ID.
   * @throws {NotFoundException} When the referenced recipe does not exist.
   */
  @Post()
  @RequirePermissions(PERMISSIONS.recetas.cocinar)
  async create(
    @Body() dto: CreatePreparacionDto,
    @Req() req: Request & { user?: { id?: string } }
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error(I18nHelper.getError('USUARIO_NO_AUTENTICADO'));
    }
    return this.preparacionService.create(dto, userId);
  }

  /**
   * Returns a paginated list of preparation orders.
   * Role-based visibility is applied by the service layer based on the user's role.
   * @param {PaginationQueryDto} query - Pagination parameters (page, limit).
   * @param {Request & { user?: { rol?: { nombre?: string } } }} req - Express request with authenticated user payload.
   * @returns {Promise<PaginatedResponseDto<Preparacion>>} Paginated list of preparations.
   */
  @Get()
  @RequirePermissions(PERMISSIONS.recetas.listar)
  async findAll(
    @Query() query: PaginationQueryDto,
    @Req() req: Request & { user?: { rol?: { nombre?: string } } }
  ) {
    const userRole = req.user?.rol?.nombre;
    return this.preparacionService.findAll(query, userRole);
  }

  /**
   * Returns a single preparation order by its ID.
   * @param {string} id - UUID of the preparation to retrieve.
   * @param {Request & { user?: { rol?: { nombre?: string } } }} req - Express request with authenticated user payload.
   * @returns {Promise<Preparacion>} The found preparation entity.
   * @throws {NotFoundException} When no preparation with the given ID exists.
   */
  @Get(':id')
  @RequirePermissions(PERMISSIONS.recetas.ver)
  async findOne(
    @Param('id') id: string,
    @Req() req: Request & { user?: { rol?: { nombre?: string } } }
  ) {
    const userRole = req.user?.rol?.nombre;
    return this.preparacionService.findOne(id, userRole);
  }

  /**
   * Transitions a preparation from PENDIENTE to EN_PROCESO.
   * @param {string} id - UUID of the preparation to start.
   * @returns {Promise<Preparacion>} Updated preparation entity with estado EN_PROCESO.
   * @throws {NotFoundException} When no preparation with the given ID exists.
   * @throws {ConflictException} When the preparation is not in PENDIENTE state.
   */
  @Patch(':id/iniciar')
  @RequirePermissions(PERMISSIONS.recetas.cocinar)
  async iniciar(@Param('id') id: string) {
    return this.preparacionService.iniciarPreparacion(id);
  }

  /**
   * Finalises a preparation in EN_PROCESO by executing production and transitioning to COMPLETADA.
   * @param {string} id - UUID of the preparation to finalise.
   * @param {Request & { user?: { id?: string } }} req - Express request with authenticated user payload.
   * @param {string} [ubicacionDestinoId] - Optional override destination location from request body.
   * @returns {Promise<Preparacion>} Updated preparation entity with estado COMPLETADA.
   * @throws {Error} When the request has no authenticated user ID.
   * @throws {NotFoundException} When no preparation with the given ID exists.
   * @throws {ConflictException} When the preparation is not in EN_PROCESO state.
   * @throws {BadRequestException} When no destination location is available.
   */
  @Patch(':id/finalizar')
  @RequirePermissions(PERMISSIONS.recetas.cocinar)
  async finalizar(
    @Param('id') id: string,
    @Req() req: Request & { user?: { id?: string } },
    @Body('ubicacionDestinoId') ubicacionDestinoId?: string
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error(I18nHelper.getError('USUARIO_NO_AUTENTICADO'));
    }
    return this.preparacionService.finalizarPreparacion(
      id,
      userId,
      ubicacionDestinoId
    );
  }

  /**
   * Cancels a preparation that has not yet been completed.
   * @param {string} id - UUID of the preparation to cancel.
   * @returns {Promise<Preparacion>} Updated preparation entity with estado CANCELADA.
   * @throws {NotFoundException} When no preparation with the given ID exists.
   * @throws {ConflictException} When the preparation is already in COMPLETADA state.
   */
  @Patch(':id/cancelar')
  @RequirePermissions(PERMISSIONS.recetas.cocinar)
  async cancelar(@Param('id') id: string) {
    return this.preparacionService.cancelarPreparacion(id);
  }

  /**
   * Soft-deletes a preparation order by ID.
   * @param {string} id - UUID of the preparation to remove.
   * @returns {Promise<void>}
   */
  @Delete(':id')
  @RequirePermissions(PERMISSIONS.recetas.eliminar)
  async remove(@Param('id') id: string) {
    return this.preparacionService.remove(id);
  }
}

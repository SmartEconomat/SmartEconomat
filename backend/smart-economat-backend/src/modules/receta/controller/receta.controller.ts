import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Res,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ParseUUIDv7Pipe } from '../../../common/pipes/parse-uuid-v7.pipe';
import * as express from 'express';
import { SortableFields } from '../../../common/decorators/sortable-fields.decorator';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { RecetaService } from '../service/receta.service';
import { RecetaPdfService } from '../service/receta-pdf.service';
import { CreateRecetaDto } from '../dto/create-receta.dto';
import { UpdateRecetaDto } from '../dto/update-receta.dto';
import { DuplicateRecetaDto } from '../dto/duplicate-receta.dto';
import { DetalleRecetaDto } from '../dto/detalle-receta.dto';
import { CocinarRecetaDto } from '../dto/cocinar-receta.dto';
import { RecetaCostResponseDto } from '../dto/receta-cost-response.dto';
import { RecetaPreviewCostDto } from '../dto/receta-preview-cost.dto';
import { Receta } from '../receta.entity/receta.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { PermisosGuard } from '../../auth/guards/auth-permissions.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { rolUsuario } from '../../usuario/enums/usuario.enums';
import { PERMISSIONS } from '../../../common/constants/permissions.constants';

/**
 * Controller that exposes REST endpoints for managing recipes (recetas),
 * including CRUD, cost calculation, cooking, duplication, and PDF export.
 * All routes require JWT authentication and permission-based authorization.
 *
 * @class RecetaController
 */
@ApiTags('Recetas')
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('recetas')
export class RecetaController {
  /**
   * Creates an instance of RecetaController.
   *
   * @param {RecetaService} recetaService - Service handling core recipe business logic.
   * @param {RecetaPdfService} recetaPdfService - Service for generating PDF documents for recipes.
   */
  constructor(
    private readonly recetaService: RecetaService,
    private readonly recetaPdfService: RecetaPdfService
  ) {}

  /**
   * Creates a new recipe and computes its initial estimated unit cost.
   *
   * @param {CreateRecetaDto} createRecetaDto - Body containing recipe details and ingredient list.
   * @returns {Promise<Receta>} The newly created recipe with computed cost.
   * @throws {BadRequestException} When the DTO fails validation.
   * @example
   * POST /recetas
   */
  @Post()
  @RequirePermissions(PERMISSIONS.recetas.crear)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createRecetaDto: CreateRecetaDto): Promise<Receta> {
    return this.recetaService.create(createRecetaDto);
  }

  /**
   * Duplicates an existing recipe under a new name.
   *
   * @param {DuplicateRecetaDto} duplicateRecetaDto - Body containing the source recipe ID and the new name.
   * @returns {Promise<Receta>} The newly created duplicate recipe.
   * @throws {NotFoundException} When the source recipe does not exist.
   * @example
   * POST /recetas/duplicate
   */
  @Post('duplicate')
  @RequirePermissions(PERMISSIONS.recetas.duplicar)
  @HttpCode(HttpStatus.CREATED)
  duplicate(@Body() duplicateRecetaDto: DuplicateRecetaDto): Promise<Receta> {
    return this.recetaService.duplicate(duplicateRecetaDto);
  }

  /**
   * Returns a paginated list of recipes, applying role-based visibility if applicable.
   *
   * @param {PaginationQueryDto} query - Pagination, sorting, and search parameters.
   * @param {{ user?: { rol?: string } }} req - Express request object with the optional authenticated user role.
   * @returns {Promise<PaginatedResponseDto<Receta>>} Paginated collection of recipes.
   * @example
   * GET /recetas?page=1&limit=20&sortBy=nombre&order=ASC
   */
  @Get()
  @RequirePermissions(PERMISSIONS.recetas.listar)
  findAll(
    @SortableFields([
      'nombre',
      'tiempoEstimadoMinutos',
      'tiempo',
      'tiempoPreparacion',
      'dificultad',
      'rendimiento',
      'costeUnitarioEstimado',
      'createdAt',
      'updatedAt',
    ])
    query: PaginationQueryDto,
    @Req() req: { user?: { rol?: string } }
  ): Promise<PaginatedResponseDto<Receta>> {
    const userRole = req.user?.rol;
    return this.recetaService.findAll(query, userRole);
  }

  /**
   * Retrieves a single recipe by its UUID.
   *
   * @param {string} id - UUID v7 of the recipe.
   * @param {{ user?: { rol?: string } }} req - Express request object with the optional authenticated user role.
   * @returns {Promise<Receta>} The found recipe with ingredients and relations.
   * @throws {NotFoundException} When no recipe exists with the given ID.
   * @example
   * GET /recetas/:id
   */
  @Get(':id')
  @RequirePermissions(PERMISSIONS.recetas.ver)
  findOne(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Req() req: { user?: { rol?: string } }
  ): Promise<Receta> {
    const userRole = req.user?.rol;
    return this.recetaService.findOne(id, userRole);
  }

  /**
   * Returns detailed information for a recipe, including per-ingredient current stock,
   * quantity deficits, and the consolidated allergen list.
   *
   * @param {string} id - UUID v7 of the recipe.
   * @returns {Promise<DetalleRecetaDto>} Recipe detail with stock analysis and allergens.
   * @throws {NotFoundException} When no recipe exists with the given ID.
   * @example
   * GET /recetas/:id/detalle
   */
  @Get(':id/detalle')
  @RequirePermissions(PERMISSIONS.recetas.ver)
  getDetalle(
    @Param('id', ParseUUIDv7Pipe) id: string
  ): Promise<DetalleRecetaDto> {
    return this.recetaService.getDetalle(id);
  }

  /**
   * Calculates and returns the full cost breakdown (escandallo) for a recipe.
   *
   * @param {string} id - UUID v7 of the recipe.
   * @returns {Promise<RecetaCostResponseDto>} Cost summary with total and per-ingredient breakdown.
   * @throws {NotFoundException} When no recipe exists with the given ID.
   * @example
   * GET /recetas/:id/escandallo
   */
  @Get(':id/escandallo')
  @RequirePermissions(PERMISSIONS.recetas.ver)
  @ApiOperation({ summary: 'Calcular el escandallo (coste) de una receta' })
  @ApiParam({ name: 'id', description: 'docs.UUID_DE_LA_RECETA' })
  @ApiResponse({ status: 200, type: RecetaCostResponseDto })
  @ApiResponse({ status: 404, description: 'docs.RECETA_NO_ENCONTRADA' })
  calcularEscandallo(
    @Param('id', ParseUUIDv7Pipe) id: string
  ): Promise<RecetaCostResponseDto> {
    return this.recetaService.calcularEscandallo(id);
  }

  /**
   * Consumes stock from inventory to cook a recipe the specified number of times.
   * Uses FEFO ordering with pessimistic write locks.
   *
   * @param {string} id - UUID v7 of the recipe to cook.
   * @param {CocinarRecetaDto} cocinarRecetaDto - Body containing the number of units to cook.
   * @returns {Promise<void>}
   * @throws {NotFoundException} When no recipe exists with the given ID.
   * @throws {BadRequestException} When there is insufficient stock for any ingredient.
   * @example
   * POST /recetas/:id/cocinar
   */
  @Post(':id/cocinar')
  @RequirePermissions(PERMISSIONS.recetas.cocinar)
  @HttpCode(HttpStatus.OK)
  cocinar(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Body() cocinarRecetaDto: CocinarRecetaDto
  ): Promise<void> {
    return this.recetaService.cocinar(id, cocinarRecetaDto);
  }

  /**
   * Calculates a cost preview for an ad-hoc ingredient list without saving a recipe.
   *
   * @param {RecetaPreviewCostDto} dto - Body containing the ingredient list and optional rendimiento.
   * @returns {Promise<RecetaCostResponseDto>} Preview cost summary.
   * @example
   * POST /recetas/calculate-preview
   */
  @Post('calculate-preview')
  @RequirePermissions(PERMISSIONS.recetas.ver)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Vista previa del coste de una receta antes de crearla/editarla',
  })
  calculatePreviewCost(
    @Body() dto: RecetaPreviewCostDto
  ): Promise<RecetaCostResponseDto> {
    return this.recetaService.calculatePreviewCost(dto);
  }

  /**
   * Generates and streams a PDF document containing one or more recipes.
   *
   * @param {string | string[]} ids - Comma-separated string or array of recipe UUID v7 values.
   * @param {string | undefined} includeImage - Whether to include recipe images in the PDF (defaults to true unless 'false').
   * @param {express.Response} res - Express response object used for streaming the PDF.
   * @returns {Promise<void>}
   * @throws {BadRequestException} When no recipe IDs are provided.
   * @example
   * GET /recetas/export/pdf?ids=id1,id2&includeImage=true
   */
  @Get('export/pdf')
  @RequirePermissions(PERMISSIONS.recetas.ver)
  @ApiOperation({ summary: 'Generar PDF de varias recetas' })
  async exportMultiplePdf(
    @Query('ids') ids: string | string[],
    @Query('includeImage') includeImage: string | undefined,
    @Res() res: express.Response
  ): Promise<void> {
    const idArray = Array.isArray(ids)
      ? ids
      : ids?.split(',').filter((id) => id.length > 0) || [];
    if (idArray.length === 0) {
      throw new BadRequestException(
        'Debe proporcionar al menos un ID de receta.'
      );
    }
    await this.recetaPdfService.generatePdf(idArray, res, {
      includeImage: includeImage !== 'false',
    });
  }

  /**
   * Generates and streams a PDF document for a single recipe.
   *
   * @param {string} id - UUID v7 of the recipe.
   * @param {string | undefined} includeImage - Whether to include the recipe image in the PDF (defaults to true unless 'false').
   * @param {express.Response} res - Express response object used for streaming the PDF.
   * @returns {Promise<void>}
   * @throws {NotFoundException} When no recipe exists with the given ID.
   * @example
   * GET /recetas/:id/pdf?includeImage=true
   */
  @Get(':id/pdf')
  @RequirePermissions(PERMISSIONS.recetas.ver)
  @ApiOperation({ summary: 'Generar PDF de una receta' })
  async exportSinglePdf(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Query('includeImage') includeImage: string | undefined,
    @Res() res: express.Response
  ): Promise<void> {
    await this.recetaPdfService.generatePdf([id], res, {
      includeImage: includeImage !== 'false',
    });
  }

  /**
   * Recalculates and persists the estimated unit cost for a recipe.
   * Restricted to ADMIN and PROFESOR roles.
   *
   * @param {string} id - UUID v7 of the recipe whose costs must be recalculated.
   * @returns {Promise<Receta>} The updated recipe with the new costeUnitarioEstimado value.
   * @throws {NotFoundException} When no recipe exists with the given ID.
   * @example
   * POST /recetas/:id/recalcular-costes
   */
  @Post(':id/recalcular-costes')
  @Roles(rolUsuario.ADMIN, rolUsuario.PROFESOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Recalcular y guardar el coste unitario estimado de la receta',
  })
  @ApiParam({ name: 'id', description: 'docs.UUID_DE_LA_RECETA' })
  @ApiResponse({ status: 200, type: Receta })
  recalcularCostes(@Param('id', ParseUUIDv7Pipe) id: string): Promise<Receta> {
    return this.recetaService.recalcularCostes(id);
  }

  /**
   * Updates an existing recipe and recalculates its estimated unit cost.
   *
   * @param {string} id - UUID v7 of the recipe to update.
   * @param {UpdateRecetaDto} updateRecetaDto - Partial data to update on the recipe.
   * @returns {Promise<Receta>} The updated recipe with recomputed cost.
   * @throws {NotFoundException} When no recipe exists with the given ID.
   * @example
   * PATCH /recetas/:id
   */
  @Patch(':id')
  @RequirePermissions(PERMISSIONS.recetas.editar)
  async update(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Body() updateRecetaDto: UpdateRecetaDto
  ): Promise<Receta> {
    return this.recetaService.update(id, updateRecetaDto);
  }

  /**
   * Soft-deletes a recipe from the system.
   *
   * @param {string} id - UUID v7 of the recipe to remove.
   * @returns {Promise<void>}
   * @throws {NotFoundException} When no recipe exists with the given ID.
   * @example
   * DELETE /recetas/:id
   */
  @Delete(':id')
  @RequirePermissions(PERMISSIONS.recetas.eliminar)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDv7Pipe) id: string): Promise<void> {
    return this.recetaService.remove(id);
  }
}

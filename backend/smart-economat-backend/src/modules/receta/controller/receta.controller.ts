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
import { I18nHelper } from '../../../common/helpers/i18n.helper';
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
 * Documentación en español.
 */
@ApiTags('docs.TAG_RECETAS')
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('recetas')
export class RecetaController {
  /**
   * Documentación en español.
   */
  constructor(
    private readonly recetaService: RecetaService,
    private readonly recetaPdfService: RecetaPdfService
  ) {}

  /**
   * Documentación en español.
   */
  @Post()
  @RequirePermissions(PERMISSIONS.recetas.crear)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createRecetaDto: CreateRecetaDto): Promise<Receta> {
    return this.recetaService.create(createRecetaDto);
  }

  /**
   * Documentación en español.
   */
  @Post('duplicate')
  @RequirePermissions(PERMISSIONS.recetas.duplicar)
  @HttpCode(HttpStatus.CREATED)
  duplicate(@Body() duplicateRecetaDto: DuplicateRecetaDto): Promise<Receta> {
    return this.recetaService.duplicate(duplicateRecetaDto);
  }

  /**
   * Documentación en español.
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
   * Documentación en español.
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
   * Documentación en español.
   */
  @Get(':id/detalle')
  @RequirePermissions(PERMISSIONS.recetas.ver)
  getDetalle(
    @Param('id', ParseUUIDv7Pipe) id: string
  ): Promise<DetalleRecetaDto> {
    return this.recetaService.getDetalle(id);
  }

  /**
   * Documentación en español.
   */
  @Get(':id/escandallo')
  @RequirePermissions(PERMISSIONS.recetas.ver)
  @ApiOperation({ summary: 'docs.OP_CALCULAR_ESCANDALLO' })
  @ApiParam({ name: 'id', description: 'docs.UUID_DE_LA_RECETA' })
  @ApiResponse({ status: 200, type: RecetaCostResponseDto })
  @ApiResponse({ status: 404, description: 'docs.RECETA_NO_ENCONTRADA' })
  calcularEscandallo(
    @Param('id', ParseUUIDv7Pipe) id: string
  ): Promise<RecetaCostResponseDto> {
    return this.recetaService.calcularEscandallo(id);
  }

  /**
   * Documentación en español.
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
   * Documentación en español.
   */
  @Post('calculate-preview')
  @RequirePermissions(PERMISSIONS.recetas.ver)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'docs.OP_CALCULATE_PREVIEW',
  })
  calculatePreviewCost(
    @Body() dto: RecetaPreviewCostDto
  ): Promise<RecetaCostResponseDto> {
    return this.recetaService.calculatePreviewCost(dto);
  }

  /**
   * Documentación en español.
   */
  @Get('export/pdf')
  @RequirePermissions(PERMISSIONS.recetas.ver)
  @ApiOperation({ summary: 'docs.OP_EXPORT_MULTIPLE_PDF' })
  async exportMultiplePdf(
    @Query('ids') ids: string | string[],
    @Query('includeImage') includeImage: string | undefined,
    @Query('lang') lang: string | undefined,
    @Res() res: express.Response,
    @Req() req: { user?: { idioma?: string } }
  ): Promise<void> {
    const idArray = Array.isArray(ids)
      ? ids
      : ids?.split(',').filter((id) => id.length > 0) || [];

    if (idArray.length === 0) {
      throw new BadRequestException(
        I18nHelper.getError('MIN_ONE_RECIPE_ID_REQUIRED')
      );
    }

    const userLang = lang || req.user?.idioma || 'es';

    await this.recetaPdfService.generatePdf(
      idArray,
      res,
      {
        includeImage: includeImage !== 'false',
      },
      userLang
    );
  }

  /**
   * Documentación en español.
   */
  @Get(':id/pdf')
  @RequirePermissions(PERMISSIONS.recetas.ver)
  @ApiOperation({ summary: 'docs.OP_EXPORT_SINGLE_PDF' })
  async exportSinglePdf(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Query('includeImage') includeImage: string | undefined,
    @Query('lang') lang: string | undefined,
    @Res() res: express.Response,
    @Req() req: { user?: { idioma?: string } }
  ): Promise<void> {
    const userLang = lang || req.user?.idioma || 'es';

    await this.recetaPdfService.generatePdf(
      [id],
      res,
      {
        includeImage: includeImage !== 'false',
      },
      userLang
    );
  }

  /**
   * Documentación en español.
   */
  @Post(':id/recalcular-costes')
  @Roles(rolUsuario.ADMIN, rolUsuario.PROFESOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'docs.OP_RECALCULAR_COSTES',
  })
  @ApiParam({ name: 'id', description: 'docs.UUID_DE_LA_RECETA' })
  @ApiResponse({ status: 200, type: Receta })
  recalcularCostes(@Param('id', ParseUUIDv7Pipe) id: string): Promise<Receta> {
    return this.recetaService.recalcularCostes(id);
  }

  /**
   * Documentación en español.
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
   * Documentación en español.
   */
  @Delete(':id')
  @RequirePermissions(PERMISSIONS.recetas.eliminar)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDv7Pipe) id: string): Promise<void> {
    return this.recetaService.remove(id);
  }
}

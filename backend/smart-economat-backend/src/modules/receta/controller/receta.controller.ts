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
import { normalizeI18nLang } from '../../../common/helpers/i18n-translation-resolver.helper';
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
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { PermisosGuard } from '../../auth/guards/auth-permissions.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { rolUsuario } from '../../usuario/enums/usuario.enums';
import { PERMISSIONS } from '../../../common/constants/permissions.constants';
import { RecetaListQueryDto } from '../dto/receta-list-query.dto';
import { SORTABLE_FIELDS } from '../../../common/constants/sortable-fields.constants';

/**
 * Controlador REST para receta.
 */
@ApiTags('docs.TAG_RECETAS')
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('recetas')
export class RecetaController {
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  constructor(
    private readonly recetaService: RecetaService,
    private readonly recetaPdfService: RecetaPdfService
  ) {}

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Crea recursos nuevos en base a las reglas de negocio.
   * @undefined {CreateRecetaDto} createRecetaDto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<Receta>} Datos efectivos después de ejecutar la operación.
   */
  @Post()
  @RequirePermissions(PERMISSIONS.recetas.crear)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createRecetaDto: CreateRecetaDto): Promise<Receta> {
    return this.recetaService.create(createRecetaDto);
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "duplicate" en smart-economat-backend (Nest).
   * @undefined {DuplicateRecetaDto} duplicateRecetaDto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<Receta>} Datos efectivos después de ejecutar la operación.
   */
  @Post('duplicate')
  @RequirePermissions(PERMISSIONS.recetas.duplicar)
  @HttpCode(HttpStatus.CREATED)
  duplicate(@Body() duplicateRecetaDto: DuplicateRecetaDto): Promise<Receta> {
    return this.recetaService.duplicate(duplicateRecetaDto);
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "findAll" en smart-economat-backend (Nest).
   * @undefined {RecetaListQueryDto} query - Entrada efectiva esperada por el contrato.
   * @undefined {{ user?: { rol?: string; }; }} req - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<PaginatedResponseDto<Receta>>} Datos efectivos después de ejecutar la operación.
   */
  @Get()
  @RequirePermissions(PERMISSIONS.recetas.listar)
  findAll(
    @SortableFields(SORTABLE_FIELDS.recetas, RecetaListQueryDto)
    query: RecetaListQueryDto,
    @Req() req: { user?: { rol?: string } }
  ): Promise<PaginatedResponseDto<Receta>> {
    const userRole = req.user?.rol;
    return this.recetaService.findAll(query, userRole);
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "findOne" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {{ user?: { rol?: string; }; }} req - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<Receta>} Datos efectivos después de ejecutar la operación.
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
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Obtiene valores o vistas materializadas.
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<DetalleRecetaDto>} Datos efectivos después de ejecutar la operación.
   */
  @Get(':id/detalle')
  @RequirePermissions(PERMISSIONS.recetas.ver)
  getDetalle(
    @Param('id', ParseUUIDv7Pipe) id: string
  ): Promise<DetalleRecetaDto> {
    return this.recetaService.getDetalle(id);
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "calcularEscandallo" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<RecetaCostResponseDto>} Datos efectivos después de ejecutar la operación.
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
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "cocinar" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {CocinarRecetaDto} cocinarRecetaDto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
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
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "calculatePreviewCost" en smart-economat-backend (Nest).
   * @undefined {RecetaPreviewCostDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<RecetaCostResponseDto>} Datos efectivos después de ejecutar la operación.
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
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "exportMultiplePdf" en smart-economat-backend (Nest).
   * @undefined {string | string[]} ids - Entrada efectiva esperada por el contrato.
   * @undefined {string | undefined} includeImage - Entrada efectiva esperada por el contrato.
   * @undefined {string | undefined} lang - Entrada efectiva esperada por el contrato.
   * @undefined {express.Response<any, Record<string, any>>} res - Entrada efectiva esperada por el contrato.
   * @undefined {{ user?: { idioma?: string; }; }} req - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
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

    const userLang = normalizeI18nLang(lang || req.user?.idioma || 'es');

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
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "exportSinglePdf" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {string | undefined} includeImage - Entrada efectiva esperada por el contrato.
   * @undefined {string | undefined} lang - Entrada efectiva esperada por el contrato.
   * @undefined {express.Response<any, Record<string, any>>} res - Entrada efectiva esperada por el contrato.
   * @undefined {{ user?: { idioma?: string; }; }} req - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
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
    const userLang = normalizeI18nLang(lang || req.user?.idioma || 'es');

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
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "recalcularCostes" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<Receta>} Datos efectivos después de ejecutar la operación.
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
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Persiste modificaciones válidas sobre entidades existentes.
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {UpdateRecetaDto} updateRecetaDto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<Receta>} Datos efectivos después de ejecutar la operación.
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
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "remove" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
   */
  @Delete(':id')
  @RequirePermissions(PERMISSIONS.recetas.eliminar)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDv7Pipe) id: string): Promise<void> {
    return this.recetaService.remove(id);
  }
}

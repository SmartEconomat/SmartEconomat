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
import { Receta } from '../receta.entity/receta.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { PermisosGuard } from '../../auth/guards/auth-permissions.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { rolUsuario } from '../../usuario/enums/usuario.enums';

@ApiTags('Recetas')
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('recetas')
export class RecetaController {
  constructor(
    private readonly recetaService: RecetaService,
    private readonly recetaPdfService: RecetaPdfService
  ) {}

  @Post()
  @RequirePermissions('recetas:crear')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createRecetaDto: CreateRecetaDto): Promise<Receta> {
    return this.recetaService.create(createRecetaDto);
  }

  @Post('duplicate')
  @RequirePermissions('recetas:duplicar')
  @HttpCode(HttpStatus.CREATED)
  duplicate(@Body() duplicateRecetaDto: DuplicateRecetaDto): Promise<Receta> {
    return this.recetaService.duplicate(duplicateRecetaDto);
  }

  @Get()
  @RequirePermissions('recetas:listar')
  findAll(
    @SortableFields([
      'nombre',
      'tiempoEstimadoMinutos',
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

  @Get(':id')
  @RequirePermissions('recetas:ver')
  findOne(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Req() req: { user?: { rol?: string } }
  ): Promise<Receta> {
    const userRole = req.user?.rol;
    return this.recetaService.findOne(id, userRole);
  }

  @Get(':id/detalle')
  @RequirePermissions('recetas:ver')
  getDetalle(
    @Param('id', ParseUUIDv7Pipe) id: string
  ): Promise<DetalleRecetaDto> {
    return this.recetaService.getDetalle(id);
  }

  @Get(':id/escandallo')
  @RequirePermissions('recetas:ver')
  @ApiOperation({ summary: 'Calcular el escandallo (coste) de una receta' })
  @ApiParam({ name: 'id', description: 'docs.UUID_DE_LA_RECETA' })
  @ApiResponse({ status: 200, type: RecetaCostResponseDto })
  @ApiResponse({ status: 404, description: 'docs.RECETA_NO_ENCONTRADA' })
  calcularEscandallo(
    @Param('id', ParseUUIDv7Pipe) id: string
  ): Promise<RecetaCostResponseDto> {
    return this.recetaService.calcularEscandallo(id);
  }

  @Post(':id/cocinar')
  @RequirePermissions('recetas:cocinar')
  @HttpCode(HttpStatus.OK)
  cocinar(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Body() cocinarRecetaDto: CocinarRecetaDto
  ): Promise<void> {
    return this.recetaService.cocinar(id, cocinarRecetaDto);
  }

  @Get('export/pdf')
  @RequirePermissions('recetas:ver')
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

  @Get(':id/pdf')
  @RequirePermissions('recetas:ver')
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

  @Post(':id/recalcular-costes')
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Recalcular y guardar el coste unitario estimado de la receta',
  })
  @ApiParam({ name: 'id', description: 'docs.UUID_DE_LA_RECETA' })
  @ApiResponse({ status: 200, type: Receta })
  recalcularCostes(@Param('id', ParseUUIDv7Pipe) id: string): Promise<Receta> {
    return this.recetaService.recalcularCostes(id);
  }

  @Patch(':id')
  @RequirePermissions('recetas:editar')
  async update(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Body() updateRecetaDto: UpdateRecetaDto
  ): Promise<Receta> {
    return this.recetaService.update(id, updateRecetaDto);
  }

  @Delete(':id')
  @RequirePermissions('recetas:eliminar')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDv7Pipe) id: string): Promise<void> {
    return this.recetaService.remove(id);
  }
}

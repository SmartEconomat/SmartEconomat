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
  ParseUUIDPipe,
} from '@nestjs/common';
import { SortableFields } from '../../../common/decorators/sortable-fields.decorator';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { RecetaService } from '../service/receta.service';
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
  constructor(private readonly recetaService: RecetaService) {}

  @Post()
  @RequirePermissions('recetas:crear')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createRecetaDto: CreateRecetaDto): Promise<Receta> {
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
      'tiempo',
      'dificultad',
      'tiempoPreparacion',
      'costeUnitarioEstimado',
      'createdAt',
      'updatedAt',
    ])
    query: PaginationQueryDto
  ): Promise<PaginatedResponseDto<Receta>> {
    return this.recetaService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('recetas:ver')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Receta> {
    return this.recetaService.findOne(id);
  }

  @Get(':id/detalle')
  @RequirePermissions('recetas:ver')
  getDetalle(
    @Param('id', ParseUUIDPipe) id: string
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
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<RecetaCostResponseDto> {
    return this.recetaService.calcularEscandallo(id);
  }

  @Post(':id/cocinar')
  @RequirePermissions('recetas:cocinar')
  @HttpCode(HttpStatus.OK)
  cocinar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() cocinarRecetaDto: CocinarRecetaDto
  ): Promise<void> {
    return this.recetaService.cocinar(id, cocinarRecetaDto);
  }

  @Post(':id/recalcular-costes')
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Recalcular y guardar el coste unitario estimado de la receta',
  })
  @ApiParam({ name: 'id', description: 'docs.UUID_DE_LA_RECETA' })
  @ApiResponse({ status: 200, type: Receta })
  recalcularCostes(@Param('id', ParseUUIDPipe) id: string): Promise<Receta> {
    return this.recetaService.recalcularCostes(id);
  }

  @Patch(':id')
  @RequirePermissions('recetas:editar')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRecetaDto: UpdateRecetaDto
  ): Promise<Receta> {
    return this.recetaService.update(id, updateRecetaDto);
  }

  @Delete(':id')
  @RequirePermissions('recetas:eliminar')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.recetaService.remove(id);
  }
}

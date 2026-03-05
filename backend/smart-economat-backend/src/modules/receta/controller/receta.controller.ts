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
  Query,
} from '@nestjs/common';
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
import { RolesGuard } from '../../auth/guards/role.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { rolUsuario } from '../../usuario/enums/usuario.enums';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';

@ApiTags('Recetas')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('recetas')
export class RecetaController {
  constructor(private readonly recetaService: RecetaService) {}

  @Post()
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createRecetaDto: CreateRecetaDto): Promise<Receta> {
    return this.recetaService.create(createRecetaDto);
  }

  @Post('duplicate')
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
  @HttpCode(HttpStatus.CREATED)
  duplicate(@Body() duplicateRecetaDto: DuplicateRecetaDto): Promise<Receta> {
    return this.recetaService.duplicate(duplicateRecetaDto);
  }

  @Get()
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR, rolUsuario.ALUMNO)
  findAll(
    @Query() query: PaginationQueryDto
  ): Promise<PaginatedResponseDto<Receta>> {
    return this.recetaService.findAll(query);
  }

  @Get(':id')
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR, rolUsuario.ALUMNO)
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Receta> {
    return this.recetaService.findOne(id);
  }

  @Get(':id/detalle')
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR, rolUsuario.ALUMNO)
  getDetalle(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<DetalleRecetaDto> {
    return this.recetaService.getDetalle(id);
  }

  @Get(':id/escandallo')
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR, rolUsuario.ALUMNO)
  @ApiOperation({ summary: 'Calcular el escandallo (coste) de una receta' })
  @ApiParam({ name: 'id', description: 'UUID de la receta' })
  @ApiResponse({ status: 200, type: RecetaCostResponseDto })
  @ApiResponse({ status: 404, description: 'Receta no encontrada' })
  calcularEscandallo(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<RecetaCostResponseDto> {
    return this.recetaService.calcularEscandallo(id);
  }

  @Post(':id/cocinar')
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
  @HttpCode(HttpStatus.OK)
  cocinar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() cocinarRecetaDto: CocinarRecetaDto
  ): Promise<void> {
    return this.recetaService.cocinar(id, cocinarRecetaDto);
  }

  @Patch(':id')
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRecetaDto: UpdateRecetaDto
  ): Promise<Receta> {
    return this.recetaService.update(id, updateRecetaDto);
  }

  @Delete(':id')
  @Roles(rolUsuario.ADMINISTRADOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.recetaService.remove(id);
  }
}

import { ValidarProduccionDto } from '../dto/validar-produccion.dto';
import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Patch,
  Query,
} from '@nestjs/common';
import { ParseUUIDv7Pipe } from '../../../common/pipes/parse-uuid-v7.pipe';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { ProduccionService } from '../service/produccion.service';
import { EjecutarProduccionDto } from '../dto/ejecutar-produccion.dto';
import { ProduccionLote } from '../produccion-lote.entity/produccion-lote.entity';
import { ConsumirProduccionDto } from '../dto/consumir-produccion.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { SortableFields } from '../../../common/decorators/sortable-fields.decorator';
import { PermisosGuard } from '../../auth/guards/auth-permissions.guard';
import { PERMISSIONS } from '../../../common/constants/permissions.constants';

@ApiTags('Producción')
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('produccion')
export class ProduccionController {
  constructor(private readonly produccionService: ProduccionService) {}

  @Post('ejecutar')
  @RequirePermissions(PERMISSIONS.recetas.cocinar)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Ejecutar la producción de una receta y registrar el lote',
  })
  @ApiResponse({ status: 201, type: ProduccionLote })
  @ApiResponse({
    status: 400,
    description: 'docs.STOCK_INSUFICIENTE_OR_RECETA_INV_LIDA',
  })
  @ApiResponse({ status: 404, description: 'docs.RECETA_NO_ENCONTRADA' })
  ejecutarProduccion(
    @Body() dto: EjecutarProduccionDto,
    @GetUser('id') userId: string
  ): Promise<ProduccionLote> {
    return this.produccionService.ejecutarProduccion(dto, userId);
  }

  @Post('validar')
  @RequirePermissions(PERMISSIONS.recetas.cocinar)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validar stock disponible para una o varias producciones',
  })
  validarStock(@Body() dto: ValidarProduccionDto) {
    return this.produccionService.validarMultiple(dto);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.recetas.listar)
  @ApiOperation({ summary: 'Listar todos los lotes de producción' })
  @ApiResponse({ status: 200, type: [ProduccionLote] })
  findAll(
    @SortableFields([
      'fechaProduccion',
      'fechaCaducidad',
      'cantidadProducida',
      'costeTotalReal',
      'createdAt',
    ])
    @Query()
    query: PaginationQueryDto
  ): Promise<PaginatedResponseDto<ProduccionLote>> {
    return this.produccionService.findAll(query);
  }

  @Patch('lote/:id/consumir')
  @RequirePermissions(PERMISSIONS.recetas.cocinar)
  @ApiOperation({
    summary: 'Consumir raciones o cantidad de un lote de producción',
  })
  @ApiResponse({ status: 200, type: ProduccionLote })
  consumirPorciones(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Body() dto: ConsumirProduccionDto
  ): Promise<ProduccionLote> {
    return this.produccionService.consumirPorciones(id, dto);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.recetas.ver)
  @ApiOperation({ summary: 'Obtener un lote de producción por ID' })
  @ApiParam({ name: 'id', description: 'docs.UUID_DEL_LOTE_DE_PRODUCCI_N' })
  @ApiResponse({ status: 200, type: ProduccionLote })
  @ApiResponse({ status: 404, description: 'docs.LOTE_NO_ENCONTRADO' })
  findOne(@Param('id', ParseUUIDv7Pipe) id: string): Promise<ProduccionLote> {
    return this.produccionService.findOne(id);
  }
}

import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { ProduccionService } from '../service/produccion.service';
import { EjecutarProduccionDto } from '../dto/ejecutar-produccion.dto';
import { ProduccionLote } from '../produccion-lote.entity/produccion-lote.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { PermisosGuard } from '../../auth/guards/auth-permissions.guard';

@ApiTags('Producción')
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('produccion')
export class ProduccionController {
  constructor(private readonly produccionService: ProduccionService) {}

  @Post('ejecutar')
  @RequirePermissions('recetas:cocinar')
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

  @Get()
  @RequirePermissions('recetas:listar')
  @ApiOperation({ summary: 'Listar todos los lotes de producción' })
  @ApiResponse({ status: 200, type: [ProduccionLote] })
  findAll(): Promise<ProduccionLote[]> {
    return this.produccionService.findAll();
  }

  @Get(':id')
  @RequirePermissions('recetas:ver')
  @ApiOperation({ summary: 'Obtener un lote de producción por ID' })
  @ApiParam({ name: 'id', description: 'docs.UUID_DEL_LOTE_DE_PRODUCCI_N' })
  @ApiResponse({ status: 200, type: ProduccionLote })
  @ApiResponse({ status: 404, description: 'docs.LOTE_NO_ENCONTRADO' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ProduccionLote> {
    return this.produccionService.findOne(id);
  }
}

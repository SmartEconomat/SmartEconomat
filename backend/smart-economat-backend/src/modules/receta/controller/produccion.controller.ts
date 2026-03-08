import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ParseUUIDv7Pipe } from '../../../common/pipes';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { ProduccionService } from '../service/produccion.service';
import { EjecutarProduccionDto } from '../dto/ejecutar-produccion.dto';
import { ProduccionLote } from '../produccion-lote.entity/produccion-lote.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/role.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { rolUsuario } from '../../usuario/enums/usuario.enums';

@ApiTags('Producción')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('produccion')
export class ProduccionController {
  constructor(private readonly produccionService: ProduccionService) {}

  @Post('ejecutar')
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Ejecutar la producción de una receta y registrar el lote',
  })
  @ApiResponse({ status: 201, type: ProduccionLote })
  @ApiResponse({
    status: 400,
    description: 'Stock insuficiente o receta inválida',
  })
  @ApiResponse({ status: 404, description: 'Receta no encontrada' })
  ejecutarProduccion(
    @Body() dto: EjecutarProduccionDto,
    @GetUser('id') userId: string
  ): Promise<ProduccionLote> {
    return this.produccionService.ejecutarProduccion(dto, userId);
  }

  @Get()
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR, rolUsuario.ALUMNO)
  @ApiOperation({ summary: 'Listar todos los lotes de producción' })
  @ApiResponse({ status: 200, type: [ProduccionLote] })
  findAll(): Promise<ProduccionLote[]> {
    return this.produccionService.findAll();
  }

  @Get(':id')
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR, rolUsuario.ALUMNO)
  @ApiOperation({ summary: 'Obtener un lote de producción por ID' })
  @ApiParam({ name: 'id', description: 'UUID del lote de producción' })
  @ApiResponse({ status: 200, type: ProduccionLote })
  @ApiResponse({ status: 404, description: 'Lote no encontrado' })
  findOne(@Param('id', ParseUUIDv7Pipe) id: string): Promise<ProduccionLote> {
    return this.produccionService.findOne(id);
  }
}

import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { RecepcionStockService } from '../service/recepcion-stock.service';
import { CreateRecepcionDto } from '../dto/create-recepcion.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/role.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { rolUsuario } from '../../usuario/enums/usuario.enums';

@ApiTags('Recepcion Stock')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('recepcion-stock')
export class RecepcionStockController {
  constructor(private readonly recepcionService: RecepcionStockService) {}

  @Post()
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
  @ApiOperation({
    summary: 'Procesar recepción de stock vinculada a un pedido',
  })
  @ApiResponse({
    status: 201,
    description: 'Recepción procesada correctamente.',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o error en el proceso.',
  })
  @ApiBody({ type: CreateRecepcionDto })
  async create(@Body() createRecepcionDto: CreateRecepcionDto) {
    return await this.recepcionService.procesarRecepcion(createRecepcionDto);
  }
}

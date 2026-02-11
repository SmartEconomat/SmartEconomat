import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { RecepcionStockService } from '../service/recepcion-stock.service.js';
import { CreateRecepcionDto } from '../dto/create-recepcion.dto.js';

@ApiTags('Recepcion Stock')
@Controller('recepcion-stock')
export class RecepcionStockController {
  constructor(private readonly recepcionService: RecepcionStockService) {}

  @Post()
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

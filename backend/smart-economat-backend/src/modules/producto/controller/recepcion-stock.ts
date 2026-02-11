import { Controller, Post, Body } from '@nestjs/common';
import { RecepcionStockService } from '../service/recepcion-stock.service.js';
import { CreateRecepcionDto } from '../dto/create-recepcion.dto.js';

@Controller('recepcion-stock')
export class RecepcionStockController {
  constructor(private readonly recepcionService: RecepcionStockService) {}

  @Post()
  async create(@Body() createRecepcionDto: CreateRecepcionDto) {
    return await this.recepcionService.procesarRecepcion(createRecepcionDto);
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { MovimientoService } from '../service/movimiento.service';
import { CreateMovimientoDto } from '../dto/create-movimiento.dto';
import { UpdateMovimientoDto } from '../dto/update-movimiento.dto';

@Controller('movimientos')
export class MovimientoController {
  constructor(private readonly movimientoService: MovimientoService) {}

  @Post()
  create(@Body() dto: CreateMovimientoDto) {
    return this.movimientoService.create(dto);
  }

  @Get()
  findAll() {
    return this.movimientoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.movimientoService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() dto: UpdateMovimientoDto) {
    return this.movimientoService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.movimientoService.remove(id);
  }
}

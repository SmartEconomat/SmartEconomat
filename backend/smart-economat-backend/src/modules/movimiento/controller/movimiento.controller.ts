import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { MovimientoService } from '../service/movimiento.service';
import { CreateMovimientoDto } from '../dto/create-movimiento.dto';
import { UpdateMovimientoDto } from '../dto/update-movimiento.dto';
import { Movimiento } from '../movimiento.entity/movimiento.entity';

@Controller('movimientos')
export class MovimientoController {
  constructor(private readonly movimientoService: MovimientoService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createMovimientoDto: CreateMovimientoDto
  ): Promise<Movimiento> {
    return this.movimientoService.create(createMovimientoDto);
  }

  @Get()
  findAll(): Promise<Movimiento[]> {
    return this.movimientoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Movimiento> {
    return this.movimientoService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMovimientoDto: UpdateMovimientoDto
  ): Promise<Movimiento> {
    return this.movimientoService.update(id, updateMovimientoDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.movimientoService.remove(id);
  }
}

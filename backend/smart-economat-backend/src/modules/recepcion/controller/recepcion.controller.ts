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
} from '@nestjs/common';
import { CreateRecepcionDto } from '../dto/create-recepcion.dto';
import { UpdateRecepcionDto } from '../dto/update-recepcion.dto';
import { Recepcion } from '../recepcion.entity/recepcion.entity';
import { RecepcionService } from '../service/recepcion.service';

@Controller('recepcion')
export class RecepcionController {
  constructor(private readonly recepcionService: RecepcionService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateRecepcionDto): Promise<Recepcion> {
    return this.recepcionService.create(dto);
  }

  @Get()
  findAll(): Promise<Recepcion[]> {
    return this.recepcionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Recepcion> {
    return this.recepcionService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRecepcionDto
  ): Promise<Recepcion> {
    return this.recepcionService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.recepcionService.remove(id);
  }
}

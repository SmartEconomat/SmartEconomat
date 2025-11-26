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
import { RecepcionService } from '../service/recepcion.service';
import { CreateRecepcionDto } from '../dto/create-recepcion.dto';
import { UpdateRecepcionDto } from '../dto/update-recepcion.dto';
import { Recepcion } from '../recepcion.entity/recepcion.entity';

@Controller('recepciones')
export class RecepcionController {
  constructor(private readonly recepcionService: RecepcionService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createRecepcionDto: CreateRecepcionDto): Promise<Recepcion> {
    return this.recepcionService.create(createRecepcionDto);
  }

  @Get()
  findAll(): Promise<Recepcion[]> {
    return this.recepcionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Recepcion> {
    return this.recepcionService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateRecepcionDto: UpdateRecepcionDto
  ): Promise<Recepcion> {
    return this.recepcionService.update(+id, updateRecepcionDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.recepcionService.remove(+id);
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RecetaService } from '../service/receta.service';
import { CreateRecetaDto } from '../dto/create-receta.dto';
import { UpdateRecetaDto } from '../dto/update-receta.dto';
import { Receta } from '../receta.entity/receta.entity';

@Controller('recetas')
export class RecetaController {
  constructor(private readonly recetaService: RecetaService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createRecetaDto: CreateRecetaDto): Promise<Receta> {
    return this.recetaService.create(createRecetaDto);
  }

  @Get()
  findAll(): Promise<Receta[]> {
    return this.recetaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Receta> {
    return this.recetaService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateRecetaDto: UpdateRecetaDto
  ): Promise<Receta> {
    return this.recetaService.update(id, updateRecetaDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.recetaService.remove(id);
  }
}

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
import { AlbaranService } from '../service/albaran.service';
import { CreateAlbaranDto } from '../dto/create-albaran.dto';
import { UpdateAlbaranDto } from '../dto/update-albaran.dto';
import { Albaran } from '../albaran.entity/albaran.entity';

@Controller('albaranes')
export class AlbaranController {
  constructor(private readonly albaranService: AlbaranService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createAlbaranDto: CreateAlbaranDto): Promise<Albaran> {
    return this.albaranService.create(createAlbaranDto);
  }

  @Get()
  findAll(): Promise<Albaran[]> {
    return this.albaranService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Albaran> {
    return this.albaranService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAlbaranDto: UpdateAlbaranDto
  ): Promise<Albaran> {
    return this.albaranService.update(id, updateAlbaranDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.albaranService.remove(id);
  }
}

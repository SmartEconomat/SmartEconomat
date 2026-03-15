import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PreparacionService } from '../service/preparacion.service';
import { CreatePreparacionDto } from '../dto/create-preparacion.dto';
import { UpdatePreparacionDto } from '../dto/update-preparacion.dto';

@UseGuards(JwtAuthGuard)
@Controller('preparaciones')
export class PreparacionController {
  constructor(private readonly preparacionService: PreparacionService) {}

  @Post()
  create(@Body() dto: CreatePreparacionDto) {
    return this.preparacionService.create(dto);
  }

  @Get()
  findAll() {
    return this.preparacionService.findAll();
  }

  @Get(':uuid')
  findOne(@Param('uuid') uuid: string) {
    return this.preparacionService.findOne(uuid);
  }

  @Patch(':uuid')
  update(@Param('uuid') uuid: string, @Body() dto: UpdatePreparacionDto) {
    return this.preparacionService.update(uuid, dto);
  }

  @Delete(':uuid')
  remove(@Param('uuid') uuid: string) {
    return this.preparacionService.remove(uuid);
  }

  @Post(':uuid/ejecutar')
  ejecutar(@Param('uuid') uuid: string, @Body('cantidad') cantidad: number) {
    return this.preparacionService.ejecutarPreparacion(uuid, cantidad);
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PreparacionService } from '../service/preparacion.service';
import { CreatePreparacionDto } from '../dto/create-preparacion.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import type { Request } from 'express';

@Controller('preparaciones')
@UseGuards(JwtAuthGuard)
export class PreparacionController {
  constructor(private readonly preparacionService: PreparacionService) {}

  @Post()
  async create(@Body() dto: CreatePreparacionDto, @Req() req: Request) {
    const userId = (req.user as any).id;
    return this.preparacionService.create(dto, userId);
  }

  @Get()
  async findAll(@Query() query: PaginationQueryDto, @Req() req: Request) {
    const userRole = (req.user as any).rol?.nombre;
    return this.preparacionService.findAll(query, userRole);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const userRole = (req.user as any).rol?.nombre;
    return this.preparacionService.findOne(id, userRole);
  }

  @Patch(':id/iniciar')
  async iniciar(@Param('id') id: string) {
    return this.preparacionService.iniciarPreparacion(id);
  }

  @Patch(':id/finalizar')
  async finalizar(
    @Param('id') id: string,
    @Req() req: Request,
    @Body('ubicacionDestinoId') ubicacionDestinoId?: string
  ) {
    const userId = (req.user as any).id;
    return this.preparacionService.finalizarPreparacion(
      id,
      userId,
      ubicacionDestinoId
    );
  }

  @Patch(':id/cancelar')
  async cancelar(@Param('id') id: string) {
    return this.preparacionService.cancelarPreparacion(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.preparacionService.remove(id);
  }
}

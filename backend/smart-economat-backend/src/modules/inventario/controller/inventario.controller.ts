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
  UseGuards,
  Request,
} from '@nestjs/common';
import { InventarioService } from '../service/inventario.service';
import { CreateInventarioItemDto } from '../dto/create-InventarioItem.dto';
import { UpdateInventarioDto } from '../dto/update-inventario.dto';
import { Inventario } from '../inventario.entity/inventario.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { PermisosGuard } from '../../auth/guards/auth-permissions.guard';

@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('inventario')
export class InventarioController {
  constructor(private readonly inventarioService: InventarioService) {}

  @Post()
  @RequirePermissions('inventario:crear')
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createInventarioDto: CreateInventarioItemDto,
    @Request() req: any
  ): Promise<Inventario> {
    const userId = req.user.sub as string;
    return this.inventarioService.create(createInventarioDto, userId);
  }

  @Get()
  @RequirePermissions('inventario:listar')
  findAll(): Promise<Inventario[]> {
    return this.inventarioService.findAll();
  }

  @Get(':id')
  @RequirePermissions('inventario:ver')
  findOne(@Param('id') id: string): Promise<Inventario> {
    return this.inventarioService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('inventario:editar')
  update(
    @Param('id') id: string,
    @Body() updateInventarioDto: UpdateInventarioDto,
    @Request() req: any
  ): Promise<Inventario> {
    const userId = req.user.sub as string;
    return this.inventarioService.update(id, updateInventarioDto, userId);
  }

  @Delete(':id')
  @RequirePermissions('inventario:eliminar')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @Request() req: any): Promise<void> {
    const userId = req.user.sub as string;
    return this.inventarioService.remove(id, userId);
  }
}

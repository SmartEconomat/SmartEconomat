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
} from '@nestjs/common';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { InventarioService } from '../service/inventario.service';
import { CreateInventarioItemDto } from '../dto/create-InventarioItem.dto';
import { UpdateInventarioDto } from '../dto/update-inventario.dto';
import { Inventario } from '../inventario.entity/inventario.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { SortableFields } from '../../../common/decorators/sortable-fields.decorator';
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
    @GetUser('id') userId: string
  ): Promise<Inventario> {
    return this.inventarioService.create(createInventarioDto, userId);
  }

  @Get()
  @RequirePermissions('inventario:listar')
  findAll(
    @SortableFields([
      'cantidadActual',
      'cantidadMinima',
      'cantidadMaxima',
      'fechaEntrada',
      'fechaCaducidad',
      'createdAt',
      'updatedAt',
    ])
    query: PaginationQueryDto
  ): Promise<PaginatedResponseDto<Inventario>> {
    return this.inventarioService.findAll(query);
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
    @GetUser('id') userId: string
  ): Promise<Inventario> {
    return this.inventarioService.update(id, updateInventarioDto, userId);
  }

  @Delete(':id')
  @RequirePermissions('inventario:eliminar')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id') id: string,
    @GetUser('id') userId: string
  ): Promise<void> {
    return this.inventarioService.remove(id, userId);
  }
}

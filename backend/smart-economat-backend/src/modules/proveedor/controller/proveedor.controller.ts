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
  Req,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CreateProveedorDto } from '../dto/create-proveedor.dto';
import { UpdateProveedorDto } from '../dto/update-proveedor.dto';
import { SortableFields } from '../../../common/decorators/sortable-fields.decorator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { Proveedor } from '../proveedor.entity/proveedor.entity';
import { ProveedorService } from '../service/proveedor.service';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/role.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { rolUsuario } from '../../usuario/enums/usuario.enums';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('proveedor')
export class ProveedorController {
  constructor(private readonly proveedorService: ProveedorService) {}

  @Post()
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateProveedorDto): Promise<Proveedor> {
    return this.proveedorService.create(dto);
  }

  @Get()
  @RequirePermissions('proveedores:listar')
  findAll(
    @SortableFields([
      'nombre',
      'contacto',
      'telefono',
      'email',
      'direccion',
      'nif',
      'createdAt',
      'updatedAt',
    ])
    query: PaginationQueryDto,
    @Req() req: { user?: { rol?: string } }
  ): Promise<PaginatedResponseDto<Proveedor>> {
    const userRole = req.user?.rol;
    return this.proveedorService.findAll(query, userRole);
  }

  @Get('con-pedidos')
  @RequirePermissions('proveedores:listar')
  findWithOrders(): Promise<Proveedor[]> {
    return this.proveedorService.findWithOrders();
  }

  @Get(':id')
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: { user?: { rol?: string } }
  ): Promise<Proveedor> {
    const userRole = req.user?.rol;
    return this.proveedorService.findOne(id, userRole);
  }

  @Patch(':id')
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProveedorDto
  ): Promise<Proveedor> {
    return this.proveedorService.update(id, dto);
  }

  @Delete(':id')
  @Roles(rolUsuario.ADMINISTRADOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.proveedorService.remove(id);
  }
}

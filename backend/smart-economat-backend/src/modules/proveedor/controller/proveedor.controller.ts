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
import { PermisosGuard } from '../../auth/guards/auth-permissions.guard';
import { PERMISSIONS } from '../../../common/constants/permissions.constants';

/**
 * Documentación en español.
 */
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('proveedor')
export class ProveedorController {
        /**
     * Documentación en español.
     */
  constructor(private readonly proveedorService: ProveedorService) {}

        /**
     * Documentación en español.
     */
  @Post()
  @RequirePermissions(PERMISSIONS.proveedores.crear)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateProveedorDto): Promise<Proveedor> {
    return this.proveedorService.create(dto);
  }

        /**
     * Documentación en español.
     */
  @Get()
  @RequirePermissions(PERMISSIONS.proveedores.listar)
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

        /**
     * Documentación en español.
     */
  @Get('con-pedidos')
  @RequirePermissions(PERMISSIONS.proveedores.listar)
  findWithOrders(): Promise<Proveedor[]> {
    return this.proveedorService.findWithOrders();
  }

        /**
     * Documentación en español.
     */
  @Get(':id')
  @RequirePermissions(PERMISSIONS.proveedores.listar)
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: { user?: { rol?: string } }
  ): Promise<Proveedor> {
    const userRole = req.user?.rol;
    return this.proveedorService.findOne(id, userRole);
  }

        /**
     * Documentación en español.
     */
  @Patch(':id')
  @RequirePermissions(PERMISSIONS.proveedores.editar)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProveedorDto
  ): Promise<Proveedor> {
    return this.proveedorService.update(id, dto);
  }

        /**
     * Documentación en español.
     */
  @Delete(':id')
  @RequirePermissions(PERMISSIONS.proveedores.eliminar)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.proveedorService.remove(id);
  }
}

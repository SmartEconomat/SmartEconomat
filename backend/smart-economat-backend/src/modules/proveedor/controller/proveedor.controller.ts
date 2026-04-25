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
 * REST controller that exposes CRUD endpoints for the Proveedor (supplier) resource.
 *
 * @class ProveedorController
 */
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('proveedor')
export class ProveedorController {
  /**
   * Creates an instance of ProveedorController.
   *
   * @param {ProveedorService} proveedorService - Service layer for supplier operations.
   */
  constructor(private readonly proveedorService: ProveedorService) {}

  /**
   * Creates a new supplier record.
   *
   * @param {CreateProveedorDto} dto - Supplier creation payload.
   * @returns {Promise<Proveedor>} The newly created supplier.
   */
  @Post()
  @RequirePermissions(PERMISSIONS.proveedores.crear)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateProveedorDto): Promise<Proveedor> {
    return this.proveedorService.create(dto);
  }

  /**
   * Returns a paginated list of suppliers with optional search and sort parameters.
   * Admin users also receive soft-deleted records.
   *
   * @param {PaginationQueryDto} query - Pagination, sort, and search parameters.
   * @param {{ user?: { rol?: string } }} req - Authenticated request object.
   * @returns {Promise<PaginatedResponseDto<Proveedor>>} Paginated supplier list.
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
   * Returns suppliers that have at least one associated purchase order.
   *
   * @returns {Promise<Proveedor[]>} Array of suppliers with orders.
   */
  @Get('con-pedidos')
  @RequirePermissions(PERMISSIONS.proveedores.listar)
  findWithOrders(): Promise<Proveedor[]> {
    return this.proveedorService.findWithOrders();
  }

  /**
   * Retrieves a single supplier by UUID.
   *
   * @param {string} id - UUID of the supplier.
   * @param {{ user?: { rol?: string } }} req - Authenticated request object.
   * @returns {Promise<Proveedor>} The found supplier entity.
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
   * Partially updates a supplier's fields.
   *
   * @param {string} id - UUID of the supplier to update.
   * @param {UpdateProveedorDto} dto - Fields to update.
   * @returns {Promise<Proveedor>} The updated supplier entity.
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
   * Soft-deletes a supplier. Returns HTTP 204 No Content on success.
   *
   * @param {string} id - UUID of the supplier to delete.
   * @returns {Promise<void>}
   */
  @Delete(':id')
  @RequirePermissions(PERMISSIONS.proveedores.eliminar)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.proveedorService.remove(id);
  }
}

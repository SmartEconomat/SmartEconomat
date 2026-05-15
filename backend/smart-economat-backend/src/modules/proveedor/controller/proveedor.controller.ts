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
} from '@nestjs/common';
import { ParseUUIDv7Pipe } from '../../../common/pipes/parse-uuid-v7.pipe';
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
import { SORTABLE_FIELDS } from '../../../common/constants/sortable-fields.constants';

/**
 * Controlador para la gestión de proveedores.
 * Permite realizar operaciones CRUD sobre los proveedores registrados en el sistema.
 */
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('proveedor')
export class ProveedorController {
  /**
   * Crea una instancia de ProveedorController.
   * @param proveedorService Servicio para la gestión lógica de proveedores.
   */
  constructor(private readonly proveedorService: ProveedorService) {}

  /**
   * Registra un nuevo proveedor en el sistema.
   * @param dto Datos del nuevo proveedor.
   * @returns El proveedor creado.
   */
  @Post()
  @RequirePermissions(PERMISSIONS.proveedores.crear)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateProveedorDto): Promise<Proveedor> {
    return this.proveedorService.create(dto);
  }

  /**
   * Lista los proveedores con soporte para paginación y ordenación.
   * @param query Parámetros de paginación y búsqueda.
   * @param req Petición para obtener el rol del usuario solicitante.
   * @returns Lista paginada de proveedores.
   */
  @Get()
  @RequirePermissions(PERMISSIONS.proveedores.listar)
  findAll(
    @SortableFields(SORTABLE_FIELDS.proveedores)
    query: PaginationQueryDto,
    @Req() req: { user?: { rol?: string } }
  ): Promise<PaginatedResponseDto<Proveedor>> {
    const userRole = req.user?.rol;
    return this.proveedorService.findAll(query, userRole);
  }

  /**
   * Recupera únicamente los proveedores que tienen pedidos asociados.
   * @returns Lista de proveedores con actividad de pedidos.
   */
  /**
   * Expone "findWithOrders" en smart-economat-backend (Nest).
   * @undefined {Promise<Proveedor[]>} Datos efectivos después de ejecutar la operación.
   */
  @Get('con-pedidos')
  @RequirePermissions(PERMISSIONS.proveedores.listar)
  findWithOrders(): Promise<Proveedor[]> {
    return this.proveedorService.findWithOrders();
  }

  /**
   * Obtiene el detalle de un proveedor por su ID.
   * @param id UUID del proveedor.
   * @param req Petición para contexto de usuario.
   * @returns El proveedor solicitado.
   */
  @Get(':id')
  @RequirePermissions(PERMISSIONS.proveedores.listar)
  findOne(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Req() req: { user?: { rol?: string } }
  ): Promise<Proveedor> {
    const userRole = req.user?.rol;
    return this.proveedorService.findOne(id, userRole);
  }

  /**
   * Actualiza la información de un proveedor existente.
   * @param id UUID del proveedor.
   * @param dto Datos a actualizar.
   * @returns El proveedor actualizado.
   */
  @Patch(':id')
  @RequirePermissions(PERMISSIONS.proveedores.editar)
  update(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Body() dto: UpdateProveedorDto
  ): Promise<Proveedor> {
    return this.proveedorService.update(id, dto);
  }

  /**
   * Elimina un proveedor del sistema (eliminación lógica).
   * @param id UUID del proveedor.
   */
  /**
   * Expone "remove" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {{ user: { id: string; }; }} req - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
   */
  @Delete(':id')
  @RequirePermissions(PERMISSIONS.proveedores.eliminar)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Req() req: { user: { id: string } }
  ): Promise<void> {
    return this.proveedorService.remove(id, req.user.id);
  }

  /**
   * Restaura un proveedor previamente eliminado.
   * @param id UUID del proveedor a restaurar.
   * @returns El proveedor restaurado.
   */
  @Post(':id/restore')
  @RequirePermissions(PERMISSIONS.proveedores.editar)
  @HttpCode(HttpStatus.OK)
  restore(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Req() req: { user: { id: string } }
  ): Promise<Proveedor> {
    return this.proveedorService.restore(id, req.user.id);
  }
}

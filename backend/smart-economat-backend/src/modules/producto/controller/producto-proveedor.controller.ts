import {
  Controller,
  Get,
  Query,
  Patch,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ProductoProveedorService } from '../service/producto-proveedor.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { UpdatePrecioProductoDto } from '../dto/update-precio-producto.dto';
import { UpdateMermaProveedorDto } from '../dto/update-merma-proveedor.dto';
import { ProductoProveedor } from '../producto-proveedor.entity/producto-proveedor.entity';
import { HistorialPrecio } from '../historial-precio-proveedor.entity/historial.entity';
import { SearchProductoProveedorDto } from '../dto/search-producto-proveedor.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermisosGuard } from '../../auth/guards/auth-permissions.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { PERMISSIONS } from '../../../common/constants/permissions.constants';

/** Clase pública (ProductoProveedorController). Paquete: smart-economat-backend (Nest). */
@ApiTags('Producto Proveedor')
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('producto-proveedor')
export class ProductoProveedorController {
  /**
   * Construye la instancia configurada.
   * @undefined {ProductoProveedorService} productoProveedorService - Entrada efectiva esperada por el contrato.
   */
  constructor(
    private readonly productoProveedorService: ProductoProveedorService
  ) {}

  /**
   * Persiste modificaciones válidas sobre entidades existentes.
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {UpdatePrecioProductoDto} updatePrecioProductoDto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<ProductoProveedor>} Datos efectivos después de ejecutar la operación.
   */
  @Patch(':id/precio')
  @RequirePermissions(PERMISSIONS.productos.editar)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Actualizar el precio de un producto de un proveedor y registrar histórico',
  })
  @ApiParam({ name: 'id', description: 'docs.ID_DEL_PRODUCTOPROVEEDOR' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'docs.PRECIO_ACTUALIZADO_CORRECTAMENTE',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'docs.PRODUCTO_PROVEEDOR_NO_ENCONTRADO',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'docs.EL_PRECIO_ES_IGUAL_AL_ACTUAL',
  })
  async updatePrecio(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePrecioProductoDto: UpdatePrecioProductoDto
  ): Promise<ProductoProveedor> {
    return this.productoProveedorService.updatePrecio(
      id,
      updatePrecioProductoDto
    );
  }

  /**
   * Persiste modificaciones válidas sobre entidades existentes.
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {UpdateMermaProveedorDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<ProductoProveedor>} Datos efectivos después de ejecutar la operación.
   */
  @Patch(':id/merma')
  @RequirePermissions(PERMISSIONS.productos.editar)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar la merma esperada de un producto-proveedor',
  })
  @ApiParam({ name: 'id', description: 'docs.ID_DEL_PRODUCTOPROVEEDOR' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Merma actualizada correctamente.',
    type: ProductoProveedor,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'docs.PRODUCTO_PROVEEDOR_NO_ENCONTRADO',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'La merma esperada es igual a la actual.',
  })
  async updateMerma(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMermaProveedorDto
  ): Promise<ProductoProveedor> {
    return this.productoProveedorService.updateMerma(id, dto);
  }

  /**
   * Expone "search" en smart-economat-backend (Nest).
   * @undefined {SearchProductoProveedorDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<{ id: string; productoId: string; productoNombre: string; unidad?: string; contenido?: number; proveedorId: string; proveedorNombre: string; marcaEspecifica?: string; codigoBarras?: string; precioUnitario?: number; }[]>} Datos efectivos después de ejecutar la operación.
   */
  @Get('search')
  @RequirePermissions(PERMISSIONS.productos.listar)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Buscar relaciones producto-proveedor (autocomplete)',
  })
  async search(@Query() dto: SearchProductoProveedorDto) {
    return this.productoProveedorService.search(dto);
  }

  /**
   * Expone "compararProveedores" en smart-economat-backend (Nest).
   * @undefined {string} productoId - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/producto/service/producto-proveedor.service").ComparacionProveedoresResponse>} Datos efectivos después de ejecutar la operación.
   */
  @Get('comparar/:productoId')
  @RequirePermissions(PERMISSIONS.productos.listar)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Comparar proveedores de un producto por coste efectivo (precio ajustado por merma)',
    description:
      'Calcula el coste efectivo unitario de cada proveedor usando: costeEfectivo = precio / (1 - merma/100). ' +
      'Devuelve los proveedores ordenados de menor a mayor coste efectivo, indicando el ahorro respecto al más caro.',
  })
  @ApiParam({
    name: 'productoId',
    description: 'UUID v7 del producto a comparar',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Comparación de proveedores ordenada por coste efectivo ascendente.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No se encontraron proveedores con precio para este producto.',
  })
  async compararProveedores(
    @Param('productoId', ParseUUIDPipe) productoId: string
  ) {
    return this.productoProveedorService.compararProveedores(productoId);
  }

  /**
   * Obtiene valores o vistas materializadas.
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {PaginationQueryDto} query - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<PaginatedResponseDto<HistorialPrecio>>} Datos efectivos después de ejecutar la operación.
   */
  @Get(':id/historial')
  @RequirePermissions(PERMISSIONS.productos.listar)
  @ApiOperation({
    summary: 'Obtener el historial de precios de un producto proveedor',
  })
  @ApiParam({ name: 'id', description: 'docs.ID_DEL_PRODUCTOPROVEEDOR' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'docs.HISTORIAL_DE_PRECIOS_RECUPERADO_CORRECTA',
    type: [HistorialPrecio],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'docs.PRODUCTO_PROVEEDOR_NO_ENCONTRADO',
  })
  async getHistorial(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: PaginationQueryDto
  ): Promise<PaginatedResponseDto<HistorialPrecio>> {
    return this.productoProveedorService.getHistorial(id, query);
  }
}

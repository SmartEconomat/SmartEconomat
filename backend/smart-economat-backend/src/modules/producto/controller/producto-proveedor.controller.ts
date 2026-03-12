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
import { ProductoProveedor } from '../producto-proveedor.entity/producto-proveedor.entity';
import { HistorialPrecio } from '../historial-precio-proveedor.entity/historial.entity';
import { SearchProductoProveedorDto } from '../dto/search-producto-proveedor.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { PermisosGuard } from '../../auth/guards/auth-permissions.guard';

@ApiTags('Producto Proveedor')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('producto-proveedor')
export class ProductoProveedorController {
  constructor(
    private readonly productoProveedorService: ProductoProveedorService
  ) {}

  @Patch(':id/precio')
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
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

  @Get('search')
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Buscar relaciones producto-proveedor (autocomplete)',
  })
  async search(@Query() dto: SearchProductoProveedorDto) {
    return this.productoProveedorService.search(dto);
  }

  @Get(':id/historial')
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
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

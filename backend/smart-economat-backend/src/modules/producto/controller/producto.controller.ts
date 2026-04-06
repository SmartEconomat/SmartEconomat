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
  ParseUUIDPipe,
  Req,
  Query,
} from '@nestjs/common';
import { ProductoService } from '../service/producto.service';
import { HistorialPrecio } from '../historial-precio-proveedor.entity/historial.entity';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { SortableFields } from '../../../common/decorators/sortable-fields.decorator';
import { ProductFilterDto } from '../dto/product-filter.dto';
import { CreateProductoDto } from '../dto/create-producto.dto';
import { UpdateProductoDto } from '../dto/update-producto.dto';
import { Producto } from '../producto.entity/producto.entity';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermisosGuard } from '../../auth/guards/auth-permissions.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { PERMISSIONS } from '../../../common/constants/permissions.constants';

@ApiTags('Productos')
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('productos')
export class ProductoController {
  constructor(private readonly productoService: ProductoService) {}

  @Get('generar-ean13')
  @RequirePermissions(PERMISSIONS.productos.generar_ean13)
  @ApiOperation({ summary: 'Generar un código EAN-13 único' })
  @ApiResponse({
    status: 200,
    description: 'docs.C_DIGO_GENERADO_CORRECTAMENTE',
  })
  async generarEan13(): Promise<{ codigo_barras: string }> {
    const codigo_barras = await this.productoService.generateUniqueEan13();
    return { codigo_barras };
  }

  @Post()
  @RequirePermissions(PERMISSIONS.productos.crear)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Alta compleja de producto maestro con alérgenos y proveedores en una sola operación',
  })
  @ApiBody({
    type: CreateProductoDto,
    description:
      'Permite crear un producto maestro y, opcionalmente, asociar alérgenos y variantes de proveedor en el mismo flujo transaccional.',
  })
  @ApiResponse({
    status: 201,
    description: 'docs.PRODUCTO_CREADO_CORRECTAMENTE',
    type: Producto,
  })
  @ApiResponse({
    status: 400,
    description: 'docs.DATOS_INV_LIDOS_O_C_DIGO_DE_BARRAS_DUPLI',
  })
  @ApiResponse({
    status: 404,
    description: 'docs.PROVEEDOR_NO_ENCONTRADO',
  })
  @ApiResponse({
    status: 409,
    description: 'docs.CONFLICTO_DE_PRODUCTO_O_RELACIONES_DUPLICADAS',
  })
  create(
    @Body() createProductoDto: CreateProductoDto,
    @Req() req: { user: { id: string } }
  ): Promise<Producto> {
    const userId = req.user.id;
    return this.productoService.create(createProductoDto, userId);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.productos.listar)
  @ApiOperation({ summary: 'Listar productos con filtros y paginación' })
  findAll(
    @SortableFields(
      ['nombre', 'codigoBarras', 'tipo', 'marca', 'createdAt', 'updatedAt'],
      ProductFilterDto
    )
    query: ProductFilterDto,
    @Req() req: { user?: { rol?: string } }
  ): Promise<PaginatedResponseDto<Producto>> {
    const userRole = req.user?.rol;
    return this.productoService.findAll(query, userRole);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.productos.ver)
  @ApiOperation({ summary: 'Obtener un producto por ID' })
  @ApiParam({ name: 'id', description: 'docs.UUID_DEL_PRODUCTO' })
  @ApiResponse({ status: 200, type: Producto })
  @ApiResponse({ status: 404, description: 'docs.PRODUCTO_NO_ENCONTRADO' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: { user?: { rol?: string } }
  ): Promise<Producto> {
    const userRole = req.user?.rol;
    return this.productoService.findOne(id, userRole);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.productos.editar)
  @ApiOperation({ summary: 'Actualizar un producto' })
  @ApiResponse({ status: 200, type: Producto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductoDto: UpdateProductoDto,
    @Req() req: { user: { id: string } }
  ): Promise<Producto> {
    const userId = req.user.id;
    return this.productoService.update(id, updateProductoDto, userId);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.productos.eliminar)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un producto' })
  @ApiResponse({ status: 204, description: 'docs.PRODUCTO_ELIMINADO' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: { user: { id: string } }
  ): Promise<void> {
    const userId = req.user.id;
    return this.productoService.remove(id, userId);
  }

  @Get(':id/historial-precios')
  @RequirePermissions(PERMISSIONS.productos.ver)
  @ApiOperation({ summary: 'Obtener el historial de precios de un producto' })
  @ApiParam({ name: 'id', description: 'ID del producto' })
  @ApiResponse({ status: 200, type: [HistorialPrecio] })
  async getHistorialPrecios(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('proveedorId') proveedorId?: string
  ): Promise<HistorialPrecio[]> {
    return this.productoService.getHistorialPrecios(id, proveedorId);
  }

  @Get(':id/pmp')
  @RequirePermissions(PERMISSIONS.productos.ver)
  @ApiOperation({
    summary: 'Obtener el PMP actual de un producto, desglosado por proveedor',
  })
  @ApiParam({ name: 'id', description: 'ID del producto' })
  @ApiResponse({
    status: 200,
    schema: {
      properties: {
        pmp: {
          type: 'number',
          description: 'PMP global ponderado del producto',
        },
        porProveedor: {
          type: 'array',
          items: {
            properties: {
              productoProveedorId: { type: 'string' },
              proveedorId: { type: 'string' },
              pmp: { type: 'number' },
            },
          },
        },
      },
    },
  })
  async getPmp(@Param('id', ParseUUIDPipe) id: string): Promise<{
    pmp: number;
    porProveedor: {
      productoProveedorId: string;
      proveedorId: string;
      pmp: number;
    }[];
  }> {
    const producto = await this.productoService.findOne(id);
    const porProveedor = (producto.proveedores || []).map((pp) => ({
      productoProveedorId: pp.id,
      proveedorId: pp.proveedorId,
      pmp: Number(pp.pmp) || 0,
    }));
    return { pmp: producto.pmp, porProveedor };
  }
}

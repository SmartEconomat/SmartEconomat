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
  Request,
} from '@nestjs/common';
import { ParseUUIDv7Pipe } from '../../../common/pipes';
import { ProductoService } from '../service/producto.service';
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

@ApiTags('Productos')
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('productos')
export class ProductoController {
  constructor(private readonly productoService: ProductoService) {}

  @Get('generar-ean13')
  @RequirePermissions('productos:generar_ean13')
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
  @RequirePermissions('productos:crear')
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
    @Request() req: { user?: { sub: string } }
  ): Promise<Producto> {
    const userId = req.user?.sub as string;
    return this.productoService.create(createProductoDto, userId);
  }

  @Get()
  @RequirePermissions('productos:listar')
  @ApiOperation({ summary: 'Listar productos con filtros y paginación' })
  findAll(
    @SortableFields(
      ['nombre', 'codigoBarras', 'tipo', 'marca', 'createdAt', 'updatedAt'],
      ProductFilterDto
    )
    query: ProductFilterDto
  ): Promise<PaginatedResponseDto<Producto>> {
    return this.productoService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('productos:ver')
  @ApiOperation({ summary: 'Obtener un producto por ID' })
  @ApiParam({ name: 'id', description: 'docs.UUID_DEL_PRODUCTO' })
  @ApiResponse({ status: 200, type: Producto })
  @ApiResponse({ status: 404, description: 'docs.PRODUCTO_NO_ENCONTRADO' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Producto> {
    return this.productoService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('productos:editar')
  @ApiOperation({ summary: 'Actualizar un producto' })
  @ApiResponse({ status: 200, type: Producto })
  update(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Body() updateProductoDto: UpdateProductoDto,
    @Request() req: { user?: { sub: string } }
  ): Promise<Producto> {
    const userId = req.user?.sub as string;
    return this.productoService.update(id, updateProductoDto, userId);
  }

  @Delete(':id')
  @RequirePermissions('productos:eliminar')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un producto' })
  @ApiResponse({ status: 204, description: 'docs.PRODUCTO_ELIMINADO' })
  remove(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Request() req: { user?: { sub: string } }
  ): Promise<void> {
    const userId = req.user?.sub as string;
    return this.productoService.remove(id, userId);
  }
}

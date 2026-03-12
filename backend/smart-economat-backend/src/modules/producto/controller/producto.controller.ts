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
  Query,
  Request,
} from '@nestjs/common';
import { ProductoService } from '../service/producto.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { ProductFilterDto } from '../dto/product-filter.dto';
import { CreateProductoDto } from '../dto/create-producto.dto';
import { UpdateProductoDto } from '../dto/update-producto.dto';
import { Producto } from '../producto.entity/producto.entity';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermisosGuard } from '../../auth/guards/permisos.guard';
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
      'Crear un nuevo producto con opcionalmente alérgenos y proveedores',
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
  create(
    @Body() createProductoDto: CreateProductoDto,
    @Request() req: any
  ): Promise<Producto> {
    const userId = req.user?.sub as string;
    return this.productoService.create(createProductoDto, userId);
  }

  @Get()
  @RequirePermissions('productos:listar')
  @ApiOperation({ summary: 'Listar productos con filtros y paginación' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'searchTerm', required: false, type: String })
  @ApiQuery({ name: 'codigoBarras', required: false, type: String })
  findAll(
    @Query() query: ProductFilterDto
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
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductoDto: UpdateProductoDto,
    @Request() req: any
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
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any
  ): Promise<void> {
    const userId = req.user?.sub as string;
    return this.productoService.remove(id, userId);
  }
}

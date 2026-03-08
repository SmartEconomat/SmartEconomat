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
  Query,
  Request,
} from '@nestjs/common';
import { ParseUUIDv7Pipe } from '../../../common/pipes';
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
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { PermisosGuard } from '../../authorization/guards/permisos.guard';

@ApiTags('Productos')
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('productos')
export class ProductoController {
  constructor(private readonly productoService: ProductoService) {}

  @Get('generar-ean13')
  @RequirePermissions('productos:crear')
  @ApiOperation({ summary: 'Generar un código EAN-13 único' })
  @ApiResponse({ status: 200, description: 'Código generado correctamente' })
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
    description: 'Producto creado correctamente',
    type: Producto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o código de barras duplicado',
  })
  create(
    @Body() createProductoDto: CreateProductoDto,
    @Request() req: { user?: { sub: string } }
  ): Promise<Producto> {
    const userId = req.user?.sub || null;
    return this.productoService.create(createProductoDto, userId as string);
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
  @ApiParam({ name: 'id', description: 'UUID del producto' })
  @ApiResponse({ status: 200, type: Producto })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  findOne(@Param('id', ParseUUIDv7Pipe) id: string): Promise<Producto> {
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
    const userId = req.user?.sub || null;
    return this.productoService.update(id, updateProductoDto, userId as string);
  }

  @Delete(':id')
  @RequirePermissions('productos:eliminar')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un producto' })
  @ApiResponse({ status: 204, description: 'Producto eliminado' })
  remove(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Request() req: { user?: { sub: string } }
  ): Promise<void> {
    const userId = req.user?.sub || null;
    return this.productoService.remove(id, userId as string);
  }
}

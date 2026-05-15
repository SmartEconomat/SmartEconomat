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
import { Throttle } from '@nestjs/throttler';
import { ProductoService } from '../service/producto.service';
import { HistorialPrecio } from '../historial-precio-proveedor.entity/historial.entity';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { SortableFields } from '../../../common/decorators/sortable-fields.decorator';
import { ProductFilterDto } from '../dto/product-filter.dto';
import { CreateProductoDto } from '../dto/create-producto.dto';
import { UpdateProductoDto } from '../dto/update-producto.dto';
import { ProductPriceHistoryQueryDto } from '../dto/product-price-history-query.dto';
import { Producto } from '../producto.entity/producto.entity';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermisosGuard } from '../../auth/guards/auth-permissions.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { PERMISSIONS } from '../../../common/constants/permissions.constants';
import { SORTABLE_FIELDS } from '../../../common/constants/sortable-fields.constants';

/**
 * Controlador para la gestión de productos maestros.
 * Expone endpoints para creación, consulta, actualización y eliminación de productos,
 * integrando lógica de proveedores, alérgenos y cálculo de PMP.
 */
@ApiTags('Productos')
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('productos')
export class ProductoController {
  /**
   * Crea una instancia de ProductoController.
   * @param productoService Servicio para la gestión lógica de productos.
   */
  constructor(private readonly productoService: ProductoService) {}

  /**
   * Genera un código de barras EAN-13 único que no exista en el catálogo actual.
   * @returns Un objeto con el código EAN-13 generado.
   */
  /**
   * Expone "generarEan13" en smart-economat-backend (Nest).
   * @undefined {Promise<{ codigo_barras: string; }>} Datos efectivos después de ejecutar la operación.
   */
  @Get('generar-ean13')
  @RequirePermissions(PERMISSIONS.productos.generar_ean13)
  @Throttle({ read: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Generar un código EAN-13 único' })
  @ApiResponse({
    status: 200,
    description: 'docs.C_DIGO_GENERADO_CORRECTAMENTE',
  })
  async generarEan13(): Promise<{ codigo_barras: string }> {
    const codigo_barras = await this.productoService.generateUniqueEan13();
    return { codigo_barras };
  }

  /**
   * Registra un nuevo producto maestro en el sistema.
   * Permite asociar proveedores y alérgenos en la misma operación transaccional.
   * @param createProductoDto DTO con la información del producto y sus relaciones iniciales.
   * @param req Objeto de petición para extraer el ID del usuario creador.
   * @returns El producto recién creado.
   */
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

  /**
   * Lista los productos del sistema aplicando filtros, ordenación y paginación.
   * @param query DTO de filtros y parámetros de paginación.
   * @returns Respuesta paginada con la lista de productos.
   */
  @Get()
  @RequirePermissions(PERMISSIONS.productos.listar)
  @ApiOperation({ summary: 'Listar productos con filtros y paginación' })
  findAll(
    @SortableFields(SORTABLE_FIELDS.productos, ProductFilterDto)
    query: ProductFilterDto
  ): Promise<PaginatedResponseDto<Producto>> {
    return this.productoService.findAll(query);
  }

  /**
   * Obtiene el detalle completo de un producto por su identificador único.
   * @param id UUID del producto solicitado.
   * @returns El producto con sus relaciones (proveedores, alérgenos).
   */
  @Get(':id')
  @RequirePermissions(PERMISSIONS.productos.ver)
  @ApiOperation({ summary: 'Obtener un producto por ID' })
  @ApiParam({ name: 'id', description: 'docs.UUID_DEL_PRODUCTO' })
  @ApiResponse({ status: 200, type: Producto })
  @ApiResponse({ status: 404, description: 'docs.PRODUCTO_NO_ENCONTRADO' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Producto> {
    return this.productoService.findOne(id);
  }

  /**
   * Actualiza la información de un producto existente.
   * @param id UUID del producto a modificar.
   * @param updateProductoDto DTO con los campos a actualizar.
   * @param req Objeto de petición para auditoría del usuario modificador.
   * @returns El producto actualizado.
   */
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

  /**
   * Expone "restore" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {{ user: { id: string; }; }} req - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<Producto>} Datos efectivos después de ejecutar la operación.
   */
  @Patch(':id/restore')
  @RequirePermissions(PERMISSIONS.productos.eliminar)
  @ApiOperation({ summary: 'Restaurar un producto eliminado' })
  @ApiResponse({ status: 200, type: Producto })
  restore(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: { user: { id: string } }
  ): Promise<Producto> {
    const userId = req.user.id;
    return this.productoService.restore(id, userId);
  }
  /**
   * Expone "remove" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {{ user: { id: string; }; }} req - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
   */
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

  /**
   * Recupera el histórico de cambios de precio para un producto específico.
   * @param id UUID del producto maestro.
   * @param proveedorId Opcional: filtrar historial por un proveedor concreto.
   * @returns Lista de registros de cambios de precio.
   */
  @Get(':id/historial-precios')
  @RequirePermissions(PERMISSIONS.productos.ver)
  @ApiOperation({ summary: 'Obtener el historial de precios de un producto' })
  @ApiParam({ name: 'id', description: 'ID del producto' })
  @ApiQuery({
    name: 'proveedorId',
    required: false,
    description: 'UUID del proveedor para filtrar historial por proveedor',
  })
  @ApiResponse({ status: 200, type: [HistorialPrecio] })
  async getHistorialPrecios(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ProductPriceHistoryQueryDto
  ): Promise<HistorialPrecio[]> {
    return this.productoService.getHistorialPrecios(id, query.proveedorId);
  }

  /**
   * Obtiene el Precio Medio Ponderado (PMP) actual del producto.
   * Devuelve tanto el valor global como el desglose por cada proveedor asociado.
   * @param id UUID del producto.
   * @returns Objeto con el PMP global y el detalle por proveedor.
   */
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

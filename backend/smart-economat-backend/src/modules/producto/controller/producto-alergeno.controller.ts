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
} from '@nestjs/common';
import { ParseUUIDv7Pipe } from '../../../common/pipes';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ProductoAlergenoService } from '../service/producto-alergeno.service';
import { CreateProductoAlergenoDto } from '../dto/producto-alergeno.dto/create-producto-alergeno.dto';
import { UpdateProductoAlergenoDto } from '../dto/producto-alergeno.dto/update-producto-alergeno.dto';
import { ProductoAlergeno } from '../producto-alergeno.entity/producto-alergeno.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { PermisosGuard } from '../../auth/guards/auth-permissions.guard';
import { PERMISSIONS } from '../../../common/constants/permissions.constants';

/** Clase pública (ProductoAlergenoController). Paquete: smart-economat-backend (Nest). */
@ApiTags('Producto Alérgenos')
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('producto-alergenos')
export class ProductoAlergenoController {
  /**
   * Construye la instancia configurada.
   * @undefined {ProductoAlergenoService} productoAlergenoService - Entrada efectiva esperada por el contrato.
   */
  constructor(
    private readonly productoAlergenoService: ProductoAlergenoService
  ) {}

  /**
   * Crea recursos nuevos en base a las reglas de negocio.
   * @undefined {CreateProductoAlergenoDto} createDto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<ProductoAlergeno>} Datos efectivos después de ejecutar la operación.
   */
  @Post()
  @RequirePermissions(PERMISSIONS.productos.editar)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una asociación entre producto y alérgeno' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Asociación producto-alérgeno creada correctamente.',
    type: ProductoAlergeno,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Producto no encontrado.',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'La asociación producto-alérgeno ya existe.',
  })
  create(
    @Body() createDto: CreateProductoAlergenoDto
  ): Promise<ProductoAlergeno> {
    return this.productoAlergenoService.create(createDto);
  }

  /**
   * Expone "findAll" en smart-economat-backend (Nest).
   * @undefined {string | undefined} idProducto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<ProductoAlergeno[]>} Datos efectivos después de ejecutar la operación.
   */
  @Get()
  @RequirePermissions(PERMISSIONS.productos.ver)
  @ApiOperation({ summary: 'Listar asociaciones producto-alérgeno' })
  @ApiQuery({
    name: 'idProducto',
    required: false,
    description: 'UUID v7 del producto para filtrar sus alérgenos.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Listado de asociaciones producto-alérgeno.',
    type: [ProductoAlergeno],
  })
  findAll(
    @Query('idProducto') idProducto?: string
  ): Promise<ProductoAlergeno[]> {
    return this.productoAlergenoService.findAll(idProducto);
  }

  /**
   * Expone "findOne" en smart-economat-backend (Nest).
   * @undefined {string} idProducto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<ProductoAlergeno[]>} Datos efectivos después de ejecutar la operación.
   */
  @Get(':id')
  @RequirePermissions(PERMISSIONS.productos.ver)
  @ApiOperation({ summary: 'Obtener los alérgenos de un producto' })
  @ApiParam({ name: 'id', description: 'UUID v7 del producto.' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Alérgenos asociados al producto.',
    type: [ProductoAlergeno],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Producto no encontrado.',
  })
  findOne(
    @Param('id', ParseUUIDv7Pipe) idProducto: string
  ): Promise<ProductoAlergeno[]> {
    return this.productoAlergenoService.findOne(idProducto);
  }

  /**
   * Persiste modificaciones válidas sobre entidades existentes.
   * @undefined {string} idProducto - Entrada efectiva esperada por el contrato.
   * @undefined {UpdateProductoAlergenoDto} updateDto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<ProductoAlergeno[]>} Datos efectivos después de ejecutar la operación.
   */
  @Patch(':id')
  @RequirePermissions(PERMISSIONS.productos.editar)
  @ApiOperation({
    summary: 'Reemplazar completamente los alérgenos de un producto',
  })
  @ApiParam({ name: 'id', description: 'UUID v7 del producto.' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Alérgenos del producto actualizados correctamente.',
    type: [ProductoAlergeno],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Producto no encontrado.',
  })
  update(
    @Param('id', ParseUUIDv7Pipe) idProducto: string,
    @Body() updateDto: UpdateProductoAlergenoDto
  ): Promise<ProductoAlergeno[]> {
    return this.productoAlergenoService.update(idProducto, updateDto);
  }

  /**
   * Expone "remove" en smart-economat-backend (Nest).
   * @undefined {string} idProducto - Entrada efectiva esperada por el contrato.
   * @undefined {string} alergeno - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
   */
  @Delete(':idProducto/:alergeno')
  @RequirePermissions(PERMISSIONS.productos.editar)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar una asociación concreta entre producto y alérgeno',
  })
  @ApiParam({ name: 'idProducto', description: 'UUID v7 del producto.' })
  @ApiParam({ name: 'alergeno', description: 'Valor del enum de alérgeno.' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Asociación producto-alérgeno eliminada correctamente.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'El alérgeno indicado no es válido.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'La asociación producto-alérgeno no existe.',
  })
  remove(
    @Param('idProducto', ParseUUIDv7Pipe) idProducto: string,
    @Param('alergeno') alergeno: string
  ): Promise<void> {
    return this.productoAlergenoService.remove(idProducto, alergeno);
  }
}

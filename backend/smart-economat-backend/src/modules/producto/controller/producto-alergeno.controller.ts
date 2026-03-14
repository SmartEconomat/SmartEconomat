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

@ApiTags('Producto Alérgenos')
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('producto-alergenos')
export class ProductoAlergenoController {
  constructor(
    private readonly productoAlergenoService: ProductoAlergenoService
  ) {}

  @Post()
  @RequirePermissions('productos:editar')
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

  @Get()
  @RequirePermissions('productos:ver')
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

  @Get(':id')
  @RequirePermissions('productos:ver')
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

  @Patch(':id')
  @RequirePermissions('productos:editar')
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

  @Delete(':idProducto/:alergeno')
  @RequirePermissions('productos:editar')
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

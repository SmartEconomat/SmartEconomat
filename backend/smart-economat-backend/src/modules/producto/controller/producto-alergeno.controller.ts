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
import { ProductoAlergenoService } from '../service/producto-alergeno.service';
import { CreateProductoAlergenoDto } from '../dto/producto-alergeno.dto/create-producto-alergeno.dto';
import { UpdateProductoAlergenoDto } from '../dto/producto-alergeno.dto/update-producto-alergeno.dto';
import { ProductoAlergeno } from '../producto-alergeno.entity/producto-alergeno.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { PermisosGuard } from '../../auth/guards/permisos.guard';

@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('producto-alergenos')
export class ProductoAlergenoController {
  constructor(
    private readonly productoAlergenoService: ProductoAlergenoService
  ) {}

  @Post()
  @RequirePermissions('productos:editar')
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createDto: CreateProductoAlergenoDto
  ): Promise<ProductoAlergeno> {
    return this.productoAlergenoService.create(createDto);
  }

  @Get()
  @RequirePermissions('productos:ver')
  findAll(
    @Query('idProducto') idProducto?: string
  ): Promise<ProductoAlergeno[]> {
    return this.productoAlergenoService.findAll(idProducto);
  }

  @Get(':id')
  @RequirePermissions('productos:ver')
  findOne(
    @Param('id', ParseUUIDv7Pipe) idProducto: string
  ): Promise<ProductoAlergeno[]> {
    return this.productoAlergenoService.findOne(idProducto);
  }

  @Patch(':id')
  @RequirePermissions('productos:editar')
  update(
    @Param('id', ParseUUIDv7Pipe) idProducto: string,
    @Body() updateDto: UpdateProductoAlergenoDto
  ): Promise<ProductoAlergeno[]> {
    return this.productoAlergenoService.update(idProducto, updateDto);
  }

  @Delete(':idProducto/:alergeno')
  @RequirePermissions('productos:editar')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('idProducto', ParseUUIDv7Pipe) idProducto: string,
    @Param('alergeno') alergeno: string
  ): Promise<void> {
    return this.productoAlergenoService.remove(idProducto, alergeno);
  }
}

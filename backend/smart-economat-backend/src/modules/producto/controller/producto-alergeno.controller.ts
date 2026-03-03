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
} from '@nestjs/common';
import { ProductoAlergenoService } from '../service/producto-alergeno.service';
import { CreateProductoAlergenoDto } from '../dto/producto-alergeno.dto/create-producto-alergeno.dto';
import { UpdateProductoAlergenoDto } from '../dto/producto-alergeno.dto/update-producto-alergeno.dto';
import { ProductoAlergeno } from '../producto-alergeno.entity/producto-alergeno.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/role.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { rolUsuario } from '../../usuario/enums/usuario.enums';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('producto-alergenos')
export class ProductoAlergenoController {
  constructor(
    private readonly productoAlergenoService: ProductoAlergenoService
  ) {}

  @Post()
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createDto: CreateProductoAlergenoDto
  ): Promise<ProductoAlergeno> {
    return this.productoAlergenoService.create(createDto);
  }

  @Get()
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR, rolUsuario.ALUMNO)
  findAll(
    @Query('idProducto') idProducto?: string
  ): Promise<ProductoAlergeno[]> {
    return this.productoAlergenoService.findAll(idProducto);
  }

  @Get(':id')
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR, rolUsuario.ALUMNO)
  findOne(
    @Param('id', ParseUUIDPipe) idProducto: string
  ): Promise<ProductoAlergeno[]> {
    return this.productoAlergenoService.findOne(idProducto);
  }

  @Patch(':id')
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
  update(
    @Param('id', ParseUUIDPipe) idProducto: string,
    @Body() updateDto: UpdateProductoAlergenoDto
  ): Promise<ProductoAlergeno[]> {
    return this.productoAlergenoService.update(idProducto, updateDto);
  }

  @Delete(':idProducto/:alergeno')
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('idProducto', ParseUUIDPipe) idProducto: string,
    @Param('alergeno') alergeno: string
  ): Promise<void> {
    return this.productoAlergenoService.remove(idProducto, alergeno);
  }
}

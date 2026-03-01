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
import { ApiQuery } from '@nestjs/swagger';
import { ProductFilterDto } from '../dto/product-filter.dto';
import { CreateProductoDto } from '../dto/create-producto.dto';
import { UpdateProductoDto } from '../dto/update-producto.dto';
import { Producto } from '../producto.entity/producto.entity';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/role.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { rolUsuario } from '../../usuario/enums/usuario.enums';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('productos')
export class ProductoController {
  constructor(private readonly productoService: ProductoService) {}

  @Post()
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createProductoDto: CreateProductoDto,
    @Request() req: any
  ): Promise<Producto> {
    const userId = req.user.sub as string;
    return this.productoService.create(createProductoDto, userId);
  }

  @Get()
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR, rolUsuario.ALUMNO)
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Query() query: ProductFilterDto
  ): Promise<PaginatedResponseDto<Producto>> {
    return this.productoService.findAll(query);
  }

  @Get(':id')
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR, rolUsuario.ALUMNO)
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Producto> {
    return this.productoService.findOne(id);
  }

  @Patch(':id')
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductoDto: UpdateProductoDto,
    @Request() req: any
  ): Promise<Producto> {
    const userId = req.user.sub as string;
    return this.productoService.update(id, updateProductoDto, userId);
  }

  @Delete(':id')
  @Roles(rolUsuario.ADMINISTRADOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any
  ): Promise<void> {
    const userId = req.user.sub as string;
    return this.productoService.remove(id, userId);
  }
}

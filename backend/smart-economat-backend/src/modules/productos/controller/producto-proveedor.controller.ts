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
  ParseUUIDPipe,
} from '@nestjs/common';
import { ProductoProveedorService } from '../service/producto-proveedor.service';
import { CreateProductoProveedorDto } from '../dto/create-producto-proveedor.dto';
import { UpdateProductoProveedorDto } from '../dto/update-producto-proveedor.dto';
import { ProductoProveedor } from '../producto-proveedor.entity/producto-proveedor.entity';

@Controller('producto-proveedores')
export class ProductoProveedorController {
  constructor(private readonly service: ProductoProveedorService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateProductoProveedorDto): Promise<ProductoProveedor> {
    return this.service.create(dto);
  }

  @Get()
  findAll(): Promise<ProductoProveedor[]> {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ProductoProveedor> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductoProveedorDto
  ): Promise<ProductoProveedor> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.service.remove(id);
  }
}

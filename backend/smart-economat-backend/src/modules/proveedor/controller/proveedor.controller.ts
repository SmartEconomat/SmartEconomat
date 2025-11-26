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
} from '@nestjs/common';
import { ProveedorService } from '../service/proveedor.service';
import { CreateProveedorDto } from '../dto/create-proveedor.dto';
import { UpdateProveedorDto } from '../dto/update-proveedor.dto';
import { Proveedor } from '../proveedor.entity/proveedor.entity';

@Controller('proveedores')
export class ProveedorController {
  constructor(private readonly proveedorService: ProveedorService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createProveedorDto: CreateProveedorDto): Promise<Proveedor> {
    return this.proveedorService.create(createProveedorDto);
  }

  @Get()
  findAll(): Promise<Proveedor[]> {
    return this.proveedorService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Proveedor> {
    return this.proveedorService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateProveedorDto: UpdateProveedorDto
  ): Promise<Proveedor> {
    return this.proveedorService.update(+id, updateProveedorDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.proveedorService.remove(+id);
  }
}

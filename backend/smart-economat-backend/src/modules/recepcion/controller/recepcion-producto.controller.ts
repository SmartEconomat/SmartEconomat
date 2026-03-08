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
import { RecepcionProductoService } from '../service/recepcion-producto.service';
import { CreateRecepcionProductoDto } from '../dto/create-recepcion-producto.dto';
import { UpdateRecepcionProductoDto } from '../dto/update-recepcion-producto.dto';
import { RecepcionProducto } from '../recepcion-productos.entity/recepcion-producto.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { PermisosGuard } from '../../authorization/guards/permisos.guard';

@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('recepcion-productos')
export class RecepcionProductoController {
  constructor(
    private readonly recepcionProductoService: RecepcionProductoService
  ) {}

  @Post()
  @RequirePermissions('recepciones:editar')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateRecepcionProductoDto): Promise<RecepcionProducto> {
    return this.recepcionProductoService.create(dto);
  }

  @Get()
  @RequirePermissions('recepciones:listar')
  findAll(
    @Query() query: PaginationQueryDto
  ): Promise<PaginatedResponseDto<RecepcionProducto>> {
    return this.recepcionProductoService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('recepciones:ver')
  findOne(
    @Param('id', ParseUUIDv7Pipe) id: string
  ): Promise<RecepcionProducto> {
    return this.recepcionProductoService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('recepciones:editar')
  update(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Body() dto: UpdateRecepcionProductoDto
  ): Promise<RecepcionProducto> {
    return this.recepcionProductoService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('recepciones:eliminar')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDv7Pipe) id: string): Promise<void> {
    return this.recepcionProductoService.remove(id);
  }
}

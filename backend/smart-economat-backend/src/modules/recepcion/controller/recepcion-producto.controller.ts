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
import { RolesGuard } from '../../auth/guards/role.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { rolUsuario } from '../../usuario/enums/usuario.enums';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('recepcion-productos')
export class RecepcionProductoController {
  constructor(
    private readonly recepcionProductoService: RecepcionProductoService
  ) {}

  @Post()
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateRecepcionProductoDto): Promise<RecepcionProducto> {
    return this.recepcionProductoService.create(dto);
  }

  @Get()
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
  findAll(
    @Query() query: PaginationQueryDto
  ): Promise<PaginatedResponseDto<RecepcionProducto>> {
    return this.recepcionProductoService.findAll(query);
  }

  @Get(':id')
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
  findOne(
    @Param('id', ParseUUIDv7Pipe) id: string
  ): Promise<RecepcionProducto> {
    return this.recepcionProductoService.findOne(id);
  }

  @Patch(':id')
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
  update(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Body() dto: UpdateRecepcionProductoDto
  ): Promise<RecepcionProducto> {
    return this.recepcionProductoService.update(id, dto);
  }

  @Delete(':id')
  @Roles(rolUsuario.ADMINISTRADOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDv7Pipe) id: string): Promise<void> {
    return this.recepcionProductoService.remove(id);
  }
}

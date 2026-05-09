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
} from '@nestjs/common';
import { SortableFields } from '../../../common/decorators/sortable-fields.decorator';
import { ParseUUIDv7Pipe } from '../../../common/pipes';
import { RecepcionProductoService } from '../service/recepcion-producto.service';
import { CreateRecepcionProductoDto } from '../dto/create-recepcion-producto.dto';
import { UpdateRecepcionProductoDto } from '../dto/update-recepcion-producto.dto';
import { RecepcionProducto } from '../recepcion-productos.entity/recepcion-producto.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { PermisosGuard } from '../../auth/guards/auth-permissions.guard';
import { PERMISSIONS } from '../../../common/constants/permissions.constants';
import { SORTABLE_FIELDS } from '../../../common/constants/sortable-fields.constants';

/** Clase pública (RecepcionProductoController). Paquete: smart-economat-backend (Nest). */
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('recepcion-productos')
export class RecepcionProductoController {
  /**
   * Construye la instancia configurada.
   * @undefined {RecepcionProductoService} recepcionProductoService - Entrada efectiva esperada por el contrato.
   */
  constructor(
    private readonly recepcionProductoService: RecepcionProductoService
  ) {}

  /**
   * Crea recursos nuevos en base a las reglas de negocio.
   * @undefined {CreateRecepcionProductoDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<RecepcionProducto>} Datos efectivos después de ejecutar la operación.
   */
  @Post()
  @RequirePermissions(PERMISSIONS.recepciones.editar)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateRecepcionProductoDto): Promise<RecepcionProducto> {
    return this.recepcionProductoService.create(dto);
  }

  /**
   * Expone "findAll" en smart-economat-backend (Nest).
   * @undefined {PaginationQueryDto} query - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<PaginatedResponseDto<RecepcionProducto>>} Datos efectivos después de ejecutar la operación.
   */
  @Get()
  @RequirePermissions(PERMISSIONS.recepciones.listar)
  findAll(
    @SortableFields(SORTABLE_FIELDS.recepcionProductos)
    query: PaginationQueryDto
  ): Promise<PaginatedResponseDto<RecepcionProducto>> {
    return this.recepcionProductoService.findAll(query);
  }

  /**
   * Expone "findOne" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<RecepcionProducto>} Datos efectivos después de ejecutar la operación.
   */
  @Get(':id')
  @RequirePermissions(PERMISSIONS.recepciones.ver)
  findOne(
    @Param('id', ParseUUIDv7Pipe) id: string
  ): Promise<RecepcionProducto> {
    return this.recepcionProductoService.findOne(id);
  }

  /**
   * Persiste modificaciones válidas sobre entidades existentes.
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {UpdateRecepcionProductoDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<RecepcionProducto>} Datos efectivos después de ejecutar la operación.
   */
  @Patch(':id')
  @RequirePermissions(PERMISSIONS.recepciones.editar)
  update(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Body() dto: UpdateRecepcionProductoDto
  ): Promise<RecepcionProducto> {
    return this.recepcionProductoService.update(id, dto);
  }

  /**
   * Expone "remove" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
   */
  @Delete(':id')
  @RequirePermissions(PERMISSIONS.recepciones.eliminar)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDv7Pipe) id: string): Promise<void> {
    return this.recepcionProductoService.remove(id);
  }
}

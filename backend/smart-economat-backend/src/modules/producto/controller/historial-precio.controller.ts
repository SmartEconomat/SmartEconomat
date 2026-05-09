import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ParseUUIDv7Pipe } from '../../../common/pipes';
import { HistorialPrecioService } from '../service/historial-precio.service';
import { CreateHistorialPrecioDto } from '../dto/historial-precio.dto/create-historial-precio.dto';
import { UpdateHistorialPrecioDto } from '../dto/historial-precio.dto/update-historial-precio.dto';
import { HistorialPrecio } from '../historial-precio-proveedor.entity/historial.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ApiQuery } from '@nestjs/swagger';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { PermisosGuard } from '../../auth/guards/auth-permissions.guard';
import { PERMISSIONS } from '../../../common/constants/permissions.constants';

/** Clase pública (HistorialPrecioController). Paquete: smart-economat-backend (Nest). */
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('historial-precio')
export class HistorialPrecioController {
  /**
   * Construye la instancia configurada.
   * @undefined {HistorialPrecioService} historialPrecioService - Entrada efectiva esperada por el contrato.
   */
  constructor(
    private readonly historialPrecioService: HistorialPrecioService
  ) {}

  /**
   * Crea recursos nuevos en base a las reglas de negocio.
   * @undefined {CreateHistorialPrecioDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<HistorialPrecio>} Datos efectivos después de ejecutar la operación.
   */
  @Post()
  @RequirePermissions(PERMISSIONS.productos.editar)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateHistorialPrecioDto): Promise<HistorialPrecio> {
    return this.historialPrecioService.create(dto);
  }

  /**
   * Expone "findAll" en smart-economat-backend (Nest).
   * @undefined {"ASC" | "DESC"} order - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<HistorialPrecio[]>} Datos efectivos después de ejecutar la operación.
   */
  @Get()
  @RequirePermissions(PERMISSIONS.productos.ver)
  @HttpCode(HttpStatus.OK)
  @ApiQuery({
    name: 'order',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'docs.DIRECCI_N_DE_ORDENAMIENTO_POR_FECHA',
  })
  findAll(
    @Query('order') order: 'ASC' | 'DESC' = 'DESC'
  ): Promise<HistorialPrecio[]> {
    return this.historialPrecioService.findAll(order);
  }

  /**
   * Expone "findOne" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<HistorialPrecio>} Datos efectivos después de ejecutar la operación.
   */
  @Get(':id')
  @RequirePermissions(PERMISSIONS.productos.ver)
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id', ParseUUIDv7Pipe) id: string): Promise<HistorialPrecio> {
    return this.historialPrecioService.findOne(id);
  }

  /**
   * Persiste modificaciones válidas sobre entidades existentes.
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {UpdateHistorialPrecioDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<HistorialPrecio>} Datos efectivos después de ejecutar la operación.
   */
  @Patch(':id')
  @RequirePermissions(PERMISSIONS.productos.editar)
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Body() dto: UpdateHistorialPrecioDto
  ): Promise<HistorialPrecio> {
    return this.historialPrecioService.update(id, dto);
  }

  /**
   * Expone "remove" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
   */
  @Delete(':id')
  @RequirePermissions(PERMISSIONS.productos.eliminar)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDv7Pipe) id: string): Promise<void> {
    return this.historialPrecioService.remove(id);
  }
}

import {
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { ParseUUIDv7Pipe } from '../pipes/parse-uuid-v7.pipe';
import { PaginationQueryDto } from '../dto/pagination-query.dto';
import { PaginatedResponseDto } from '../dto/paginated-response.dto';

/** Contrato de tipos público (IBaseService). Contexto: smart-economat-backend (Nest). */
export interface IBaseService<T, CreateDto, UpdateDto> {
  create(dto: CreateDto): Promise<T>;
  findAll(
    query: PaginationQueryDto,
    relations?: string[],
    userRole?: string
  ): Promise<PaginatedResponseDto<T>>;
  findOne(id: string, relations?: string[], userRole?: string): Promise<T>;
  update(id: string, dto: UpdateDto, relations?: string[]): Promise<T>;
  remove(id: string): Promise<void>;
}

/** Clase pública (BaseController). Paquete: smart-economat-backend (Nest). */
export abstract class BaseController<
  T,
  CreateDto,
  UpdateDto,
  Service extends IBaseService<T, CreateDto, UpdateDto>,
> {
  /**
   * Construye la instancia configurada.
   * @undefined {Service} service - Entrada efectiva esperada por el contrato.
   */
  constructor(protected readonly service: Service) {}

  /**
   * Crea recursos nuevos en base a las reglas de negocio.
   * @undefined {CreateDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<T>} Datos efectivos después de ejecutar la operación.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateDto): Promise<T> {
    return await this.service.create(dto);
  }

  /**
   * Expone "findAll" en smart-economat-backend (Nest).
   * @undefined {PaginationQueryDto} query - Entrada efectiva esperada por el contrato.
   * @undefined {{ user?: { rol?: string; }; }} req - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<PaginatedResponseDto<T>>} Datos efectivos después de ejecutar la operación.
   */
  @Get()
  async findAll(
    @Query() query: PaginationQueryDto,
    @Req() req: { user?: { rol?: string } }
  ): Promise<PaginatedResponseDto<T>> {
    const userRole = req.user?.rol;
    return await this.service.findAll(query, undefined, userRole);
  }

  /**
   * Expone "findOne" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {{ user?: { rol?: string; }; }} req - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<T>} Datos efectivos después de ejecutar la operación.
   */
  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Req() req: { user?: { rol?: string } }
  ): Promise<T> {
    const userRole = req.user?.rol;
    return await this.service.findOne(id, undefined, userRole);
  }

  /**
   * Persiste modificaciones válidas sobre entidades existentes.
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {UpdateDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<T>} Datos efectivos después de ejecutar la operación.
   */
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Body() dto: UpdateDto
  ): Promise<T> {
    return await this.service.update(id, dto);
  }

  /**
   * Expone "remove" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDv7Pipe) id: string): Promise<void> {
    return await this.service.remove(id);
  }
}

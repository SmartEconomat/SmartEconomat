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

export abstract class BaseController<
  T,
  CreateDto,
  UpdateDto,
  Service extends IBaseService<T, CreateDto, UpdateDto>,
> {
  constructor(protected readonly service: Service) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateDto): Promise<T> {
    return await this.service.create(dto);
  }

  @Get()
  async findAll(
    @Query() query: PaginationQueryDto,
    @Req() req: { user?: { rol?: string } }
  ): Promise<PaginatedResponseDto<T>> {
    const userRole = req.user?.rol;
    return await this.service.findAll(query, undefined, userRole);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Req() req: { user?: { rol?: string } }
  ): Promise<T> {
    const userRole = req.user?.rol;
    return await this.service.findOne(id, undefined, userRole);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Body() dto: UpdateDto
  ): Promise<T> {
    return await this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDv7Pipe) id: string): Promise<void> {
    return await this.service.remove(id);
  }
}

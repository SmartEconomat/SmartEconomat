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
} from '@nestjs/common';
import { ParseUUIDv7Pipe } from '../pipes/parse-uuid-v7.pipe';
import { PaginationQueryDto } from '../dto/pagination-query.dto';
import { PaginatedResponseDto } from '../dto/paginated-response.dto';

export abstract class BaseController<T, CreateDto, UpdateDto, Service> {
  constructor(protected readonly service: Service) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateDto): Promise<T> {
    return await (this.service as any).create(dto);
  }

  @Get()
  async findAll(
    @Query() query: PaginationQueryDto
  ): Promise<PaginatedResponseDto<T>> {
    return await (this.service as any).findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDv7Pipe) id: string): Promise<T> {
    return await (this.service as any).findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Body() dto: UpdateDto
  ): Promise<T> {
    return await (this.service as any).update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDv7Pipe) id: string): Promise<void> {
    return await (this.service as any).remove(id);
  }
}

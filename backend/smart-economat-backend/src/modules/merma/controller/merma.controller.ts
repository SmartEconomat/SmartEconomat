import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { SortableFields } from '../../../common/decorators/sortable-fields.decorator';
import { ParseUUIDv7Pipe } from '../../../common/pipes';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermisosGuard } from '../../auth/guards/auth-permissions.guard';
import { CreateMermaDto } from '../dto/create-merma.dto';
import { Merma } from '../merma.entity/merma.entity';
import { MermaService } from '../service/merma.service';

@ApiTags('Merma')
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('merma')
export class MermaController {
  constructor(private readonly mermaService: MermaService) {}

  @Post()
  @RequirePermissions('merma:crear')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar una merma y descontar stock del inventario',
  })
  @ApiResponse({ status: 201, type: Merma })
  @ApiResponse({
    status: 400,
    description: 'Stock insuficiente o datos inválidos',
  })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  create(
    @Body() dto: CreateMermaDto,
    @GetUser('id') userId: string
  ): Promise<Merma> {
    return this.mermaService.create(dto, userId);
  }

  @Get('stats')
  @RequirePermissions('merma:stats')
  @ApiOperation({
    summary: 'Obtener estadísticas de merma por motivo y producto',
  })
  @ApiResponse({ status: 200 })
  getStats(): Promise<{ porMotivo: unknown[]; porProducto: unknown[] }> {
    return this.mermaService.getStats();
  }

  @Get()
  @RequirePermissions('merma:listar')
  @ApiOperation({ summary: 'Listar todas las mermas con paginación' })
  @ApiResponse({ status: 200, type: [Merma] })
  findAll(
    @SortableFields(['createdAt', 'cantidad', 'motivo'])
    query: PaginationQueryDto
  ): Promise<PaginatedResponseDto<Merma>> {
    return this.mermaService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('merma:ver')
  @ApiOperation({ summary: 'Obtener una merma por ID' })
  @ApiParam({ name: 'id', description: 'UUID v7 de la merma' })
  @ApiResponse({ status: 200, type: Merma })
  @ApiResponse({ status: 404, description: 'Merma no encontrada' })
  findOne(@Param('id', ParseUUIDv7Pipe) id: string): Promise<Merma> {
    return this.mermaService.findOne(id);
  }
}

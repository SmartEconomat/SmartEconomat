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
  Req,
} from '@nestjs/common';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { ParseUUIDv7Pipe } from '../../../common/pipes';
import { CreateAlbaranDto } from '../dto/create-albaran.dto';
import { UpdateAlbaranDto } from '../dto/update-albaran.dto';
import { Albaran } from '../albaran.entity/albaran.entity';
import { AlbaranService } from '../service/albaran.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { SortableFields } from '../../../common/decorators/sortable-fields.decorator';
import { PermisosGuard } from '../../auth/guards/auth-permissions.guard';

@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('albaranes')
export class AlbaranController {
  constructor(private readonly albaranService: AlbaranService) {}

  @Post()
  @RequirePermissions('albaranes:crear')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateAlbaranDto): Promise<Albaran> {
    return this.albaranService.create(dto);
  }

  @Get()
  @RequirePermissions('albaranes:listar')
  findAll(
    @SortableFields([
      'nAlbaran',
      'concordancia',
      'fecha',
      'createdAt',
      'updatedAt',
    ])
    query: PaginationQueryDto,
    @Req() req: { user?: { rol?: string } }
  ): Promise<PaginatedResponseDto<Albaran>> {
    const userRole = req.user?.rol;
    return this.albaranService.findAll(query, userRole);
  }

  @Get(':id')
  @RequirePermissions('albaranes:ver')
  findOne(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Req() req: { user?: { rol?: string } }
  ): Promise<Albaran> {
    const userRole = req.user?.rol;
    return this.albaranService.findOne(id, userRole);
  }

  @Patch(':id')
  @RequirePermissions('albaranes:editar')
  update(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Body() dto: UpdateAlbaranDto
  ): Promise<Albaran> {
    return this.albaranService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('albaranes:eliminar')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDv7Pipe) id: string): Promise<void> {
    return this.albaranService.remove(id);
  }
}

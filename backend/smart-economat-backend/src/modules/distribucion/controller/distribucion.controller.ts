import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermisosGuard } from '../../auth/guards/auth-permissions.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { ParseUUIDv7Pipe } from '../../../common/pipes';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { DistribucionService } from '../service/distribucion.service';
import { CreateDistribucionDto } from '../dto/create-distribucion.dto';
import { CancelDistribucionDto } from '../dto/cancel-distribucion.dto';

@ApiTags('Distribuciones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('distribuciones')
export class DistribucionController {
  constructor(private readonly distribucionService: DistribucionService) {}

  @Get()
  @RequirePermissions('distribuciones:listar')
  @ApiOperation({ summary: 'Listar distribuciones' })
  findAll(
    @Query() query: PaginationQueryDto,
    @Req() req: { user?: { rol?: string } }
  ) {
    return this.distribucionService.findAll(query, req.user?.rol);
  }

  @Get('disponibles')
  @RequirePermissions('distribuciones:listar')
  @ApiOperation({ summary: 'Listar pedidos de usuario distribuibles' })
  findDisponibles(@Query() query: PaginationQueryDto) {
    return this.distribucionService.findDisponibles(query);
  }

  @Get(':id')
  @RequirePermissions('distribuciones:ver')
  @ApiOperation({ summary: 'Ver detalle de distribución' })
  findOne(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Req() req: { user?: { rol?: string } }
  ) {
    return this.distribucionService.findOne(id, req.user?.rol);
  }

  @Post()
  @RequirePermissions('distribuciones:crear')
  @ApiOperation({ summary: 'Preparar una distribución' })
  create(@Body() dto: CreateDistribucionDto, @GetUser('id') userId: string) {
    return this.distribucionService.create(dto, userId);
  }

  @Patch(':id/confirmar')
  @RequirePermissions('distribuciones:confirmar')
  @ApiOperation({ summary: 'Confirmar una distribución y mover stock' })
  confirmar(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @GetUser('id') userId: string
  ) {
    return this.distribucionService.confirmar(id, userId);
  }

  @Patch(':id/cancelar')
  @RequirePermissions('distribuciones:cancelar')
  @ApiOperation({ summary: 'Cancelar una distribución no confirmada' })
  cancelar(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Body() dto: CancelDistribucionDto
  ) {
    return this.distribucionService.cancelar(id, dto);
  }
}

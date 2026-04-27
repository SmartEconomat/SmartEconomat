import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PreparacionService } from '../service/preparacion.service';
import { CreatePreparacionDto } from '../dto/create-preparacion.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermisosGuard } from '../../auth/guards/auth-permissions.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { PERMISSIONS } from '../../../common/constants/permissions.constants';
import { I18nHelper } from '../../../common/helpers/i18n.helper';
import type { Request } from 'express';

/**
 * Documentación en español.
 */
@Controller('preparaciones')
@UseGuards(JwtAuthGuard, PermisosGuard)
export class PreparacionController {
  constructor(private readonly preparacionService: PreparacionService) {}

  /**
   * Documentación en español.
   */
  @Post()
  @RequirePermissions(PERMISSIONS.recetas.cocinar)
  async create(
    @Body() dto: CreatePreparacionDto,
    @Req() req: Request & { user?: { id?: string } }
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error(I18nHelper.getError('USER_NOT_AUTHENTICATED'));
    }
    return this.preparacionService.create(dto, userId);
  }

  /**
   * Documentación en español.
   */
  @Get()
  @RequirePermissions(PERMISSIONS.recetas.listar)
  async findAll(
    @Query() query: PaginationQueryDto,
    @Req() req: Request & { user?: { rol?: { nombre?: string } } }
  ) {
    const userRole = req.user?.rol?.nombre;
    return this.preparacionService.findAll(query, userRole);
  }

  /**
   * Documentación en español.
   */
  @Get(':id')
  @RequirePermissions(PERMISSIONS.recetas.ver)
  async findOne(
    @Param('id') id: string,
    @Req() req: Request & { user?: { rol?: { nombre?: string } } }
  ) {
    const userRole = req.user?.rol?.nombre;
    return this.preparacionService.findOne(id, userRole);
  }

  /**
   * Documentación en español.
   */
  @Patch(':id/iniciar')
  @RequirePermissions(PERMISSIONS.recetas.cocinar)
  async iniciar(@Param('id') id: string) {
    return this.preparacionService.iniciarPreparacion(id);
  }

  /**
   * Documentación en español.
   */
  @Patch(':id/finalizar')
  @RequirePermissions(PERMISSIONS.recetas.cocinar)
  async finalizar(
    @Param('id') id: string,
    @Req() req: Request & { user?: { id?: string } },
    @Body('ubicacionDestinoId') ubicacionDestinoId?: string
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error(I18nHelper.getError('USER_NOT_AUTHENTICATED'));
    }
    return this.preparacionService.finalizarPreparacion(
      id,
      userId,
      ubicacionDestinoId
    );
  }

  /**
   * Documentación en español.
   */
  @Patch(':id/cancelar')
  @RequirePermissions(PERMISSIONS.recetas.cocinar)
  async cancelar(@Param('id') id: string) {
    return this.preparacionService.cancelarPreparacion(id);
  }

  /**
   * Documentación en español.
   */
  @Delete(':id')
  @RequirePermissions(PERMISSIONS.recetas.eliminar)
  async remove(@Param('id') id: string) {
    return this.preparacionService.remove(id);
  }
}

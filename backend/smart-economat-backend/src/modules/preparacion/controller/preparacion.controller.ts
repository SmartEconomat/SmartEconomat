import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
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
import { SortableFields } from '../../../common/decorators/sortable-fields.decorator';
import { SORTABLE_FIELDS } from '../../../common/constants/sortable-fields.constants';

/**
 * Controlador REST para preparacion.
 */
@Controller('preparaciones')
@UseGuards(JwtAuthGuard, PermisosGuard)
export class PreparacionController {
  /**
   * Construye la instancia configurada.
   * @undefined {PreparacionService} preparacionService - Entrada efectiva esperada por el contrato.
   */
  constructor(private readonly preparacionService: PreparacionService) {}

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Crea recursos nuevos en base a las reglas de negocio.
   * @undefined {CreatePreparacionDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {Request<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/node_modules/@types/express-serve-static-core/index").ParamsDictionary, any, any, import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/node_modules/@types/qs/index").ParsedQs, Record<string, any>> & { user?: { id?: string; }; }} req - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/preparacion/preparacion.entity/preparacion.entity").Preparacion>} Datos efectivos después de ejecutar la operación.
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
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "findAll" en smart-economat-backend (Nest).
   * @undefined {PaginationQueryDto} query - Entrada efectiva esperada por el contrato.
   * @undefined {Request<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/node_modules/@types/express-serve-static-core/index").ParamsDictionary, any, any, import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/node_modules/@types/qs/index").ParsedQs, Record<string, any>> & { user?: { rol?: { nombre?: string; }; }; }} req - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/common/dto/paginated-response.dto").PaginatedResponseDto<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/preparacion/preparacion.entity/preparacion.entity").Preparacion>>} Datos efectivos después de ejecutar la operación.
   */
  @Get()
  @RequirePermissions(PERMISSIONS.recetas.listar)
  async findAll(
    @SortableFields(SORTABLE_FIELDS.preparaciones) query: PaginationQueryDto,
    @Req() req: Request & { user?: { rol?: { nombre?: string } } }
  ) {
    const userRole = req.user?.rol?.nombre;
    return this.preparacionService.findAll(query, userRole);
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "findOne" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {Request<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/node_modules/@types/express-serve-static-core/index").ParamsDictionary, any, any, import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/node_modules/@types/qs/index").ParsedQs, Record<string, any>> & { user?: { rol?: { nombre?: string; }; }; }} req - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/preparacion/preparacion.entity/preparacion.entity").Preparacion>} Datos efectivos después de ejecutar la operación.
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
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "iniciar" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/preparacion/preparacion.entity/preparacion.entity").Preparacion>} Datos efectivos después de ejecutar la operación.
   */
  @Patch(':id/iniciar')
  @RequirePermissions(PERMISSIONS.recetas.cocinar)
  async iniciar(@Param('id') id: string) {
    return this.preparacionService.iniciarPreparacion(id);
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "finalizar" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {Request<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/node_modules/@types/express-serve-static-core/index").ParamsDictionary, any, any, import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/node_modules/@types/qs/index").ParsedQs, Record<string, any>> & { user?: { id?: string; }; }} req - Entrada efectiva esperada por el contrato.
   * @undefined {string | undefined} ubicacionDestinoId - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/preparacion/preparacion.entity/preparacion.entity").Preparacion>} Datos efectivos después de ejecutar la operación.
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
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "cancelar" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/preparacion/preparacion.entity/preparacion.entity").Preparacion>} Datos efectivos después de ejecutar la operación.
   */
  @Patch(':id/cancelar')
  @RequirePermissions(PERMISSIONS.recetas.cocinar)
  async cancelar(@Param('id') id: string) {
    return this.preparacionService.cancelarPreparacion(id);
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "remove" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
   */
  @Delete(':id')
  @RequirePermissions(PERMISSIONS.recetas.eliminar)
  async remove(@Param('id') id: string) {
    return this.preparacionService.remove(id);
  }
}

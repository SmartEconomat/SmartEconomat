import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermisosGuard } from '../../auth/guards/auth-permissions.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { PERMISSIONS } from '../../../common/constants/permissions.constants';
import { RecepcionDraftService } from '../service/recepcion-draft.service';
import { UpsertRecepcionDraftDto } from '../dto/upsert-recepcion-draft.dto';
import { RecepcionDraftResponseDto } from '../dto/recepcion-draft-response.dto';

/** Controlador de borrador de recepción. Ruta canónica: /recepciones/draft */
@ApiTags('Recepcion Draft')
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('recepciones/draft')
export class RecepcionDraftController {
  /**
   * Construye la instancia configurada.
   * @undefined {RecepcionDraftService} recepcionDraftService - Entrada efectiva esperada por el contrato.
   */
  constructor(private readonly recepcionDraftService: RecepcionDraftService) {}

  /**
   * Expone "saveDraft" en smart-economat-backend (Nest).
   * @undefined {UpsertRecepcionDraftDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {{ user: { id: string; }; }} req - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<RecepcionDraftResponseDto>} Datos efectivos después de ejecutar la operación.
   */
  @Post()
  @RequirePermissions(PERMISSIONS.recepciones.crear)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Crear o actualizar el borrador seguro de recepción',
  })
  @ApiBody({ type: UpsertRecepcionDraftDto })
  @ApiOkResponse({ type: RecepcionDraftResponseDto })
  saveDraft(
    @Body() dto: UpsertRecepcionDraftDto,
    @Request() req: { user: { id: string } }
  ): Promise<RecepcionDraftResponseDto> {
    return this.recepcionDraftService.upsertDraft(req.user.id, dto);
  }

  /**
   * Obtiene valores o vistas materializadas.
   * @undefined {{ user: { id: string; }; }} req - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<RecepcionDraftResponseDto | null>} Datos efectivos después de ejecutar la operación.
   */
  @Get()
  @RequirePermissions(PERMISSIONS.recepciones.crear)
  @ApiOperation({ summary: 'Recuperar el borrador de recepción más reciente' })
  @ApiOkResponse({ type: RecepcionDraftResponseDto })
  getLatestDraft(
    @Request() req: { user: { id: string } }
  ): Promise<RecepcionDraftResponseDto | null> {
    return this.recepcionDraftService.getLatestDraft(req.user.id);
  }

  /**
   * Expone "clearDraft" en smart-economat-backend (Nest).
   * @undefined {{ user: { id: string; }; }} req - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
   */
  @Delete()
  @RequirePermissions(PERMISSIONS.recepciones.crear)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar el borrador activo de recepción' })
  async clearDraft(@Request() req: { user: { id: string } }): Promise<void> {
    await this.recepcionDraftService.clearDraft(req.user.id);
  }
}

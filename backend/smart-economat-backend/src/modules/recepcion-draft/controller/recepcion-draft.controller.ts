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
import { RecepcionDraftService } from '../service/recepcion-draft.service';
import { UpsertRecepcionDraftDto } from '../dto/upsert-recepcion-draft.dto';
import { RecepcionDraftResponseDto } from '../dto/recepcion-draft-response.dto';

@ApiTags('Recepcion Draft')
@UseGuards(JwtAuthGuard)
@Controller('recepcion/draft')
export class RecepcionDraftController {
  constructor(private readonly recepcionDraftService: RecepcionDraftService) {}

  @Post()
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

  @Get()
  @ApiOperation({ summary: 'Recuperar el borrador de recepción más reciente' })
  @ApiOkResponse({ type: RecepcionDraftResponseDto })
  getLatestDraft(
    @Request() req: { user: { id: string } }
  ): Promise<RecepcionDraftResponseDto | null> {
    return this.recepcionDraftService.getLatestDraft(req.user.id);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar el borrador activo de recepción' })
  async clearDraft(@Request() req: { user: { id: string } }): Promise<void> {
    await this.recepcionDraftService.clearDraft(req.user.id);
  }
}

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
import { PedidoDraftService } from '../service/pedido-draft.service';
import { UpsertPedidoDraftDto } from '../dto/upsert-pedido-draft.dto';
import { PedidoDraftResponseDto } from '../dto/pedido-draft-response.dto';
import { PedidoUsuario } from '../../pedido/pedido-usuario.entity/pedido-usuario.entity';
import { PedidoDraftRecord } from '../interfaces/pedido-draft-record.interface';

/** Clase pública (PedidoDraftController). Paquete: smart-economat-backend (Nest). */
@ApiTags('Pedido Draft')
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('pedido/draft')
export class PedidoDraftController {
  /**
   * Construye la instancia configurada.
   * @undefined {PedidoDraftService} pedidoDraftService - Entrada efectiva esperada por el contrato.
   */
  constructor(private readonly pedidoDraftService: PedidoDraftService) {}

  /**
   * Expone "saveDraft" en smart-economat-backend (Nest).
   * @undefined {UpsertPedidoDraftDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {{ user: { id: string; }; }} req - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<PedidoDraftRecord>} Datos efectivos después de ejecutar la operación.
   */
  @Post()
  @RequirePermissions(PERMISSIONS.pedidos.crear)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Crear o actualizar el borrador seguro de creación de pedido',
  })
  @ApiBody({ type: UpsertPedidoDraftDto })
  @ApiOkResponse({ type: PedidoDraftResponseDto })
  saveDraft(
    @Body() dto: UpsertPedidoDraftDto,
    @Request() req: { user: { id: string } }
  ): Promise<PedidoDraftRecord> {
    return this.pedidoDraftService.upsertDraft(req.user.id, dto);
  }

  /**
   * Obtiene valores o vistas materializadas.
   * @undefined {{ user: { id: string; }; }} req - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<PedidoDraftRecord | null>} Datos efectivos después de ejecutar la operación.
   */
  @Get()
  @RequirePermissions(PERMISSIONS.pedidos.crear)
  @ApiOperation({
    summary: 'Recuperar el borrador de creación de pedido más reciente',
  })
  @ApiOkResponse({ type: PedidoDraftResponseDto })
  getLatestDraft(
    @Request() req: { user: { id: string } }
  ): Promise<PedidoDraftRecord | null> {
    return this.pedidoDraftService.getLatestDraft(req.user.id);
  }

  /**
   * Expone "clearDraft" en smart-economat-backend (Nest).
   * @undefined {{ user: { id: string; }; }} req - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
   */
  @Delete()
  @RequirePermissions(PERMISSIONS.pedidos.crear)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar el borrador activo de creación de pedido',
  })
  async clearDraft(@Request() req: { user: { id: string } }): Promise<void> {
    await this.pedidoDraftService.clearDraft(req.user.id);
  }

  /**
   * Expone "finalizeOrder" en smart-economat-backend (Nest).
   * @undefined {{ user: { id: string; }; }} req - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<PedidoUsuario>} Datos efectivos después de ejecutar la operación.
   */
  @Post('finalize')
  @RequirePermissions(PERMISSIONS.pedidos.crear)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Finalizar la creación del pedido a partir del borrador persistido',
  })
  @ApiOkResponse({ type: PedidoUsuario })
  async finalizeOrder(
    @Request() req: { user: { id: string } }
  ): Promise<PedidoUsuario> {
    return this.pedidoDraftService.finalizeOrder(req.user.id);
  }
}

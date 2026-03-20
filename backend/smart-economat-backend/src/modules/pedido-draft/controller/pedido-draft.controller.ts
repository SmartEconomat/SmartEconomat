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
import { PedidoDraftService } from '../service/pedido-draft.service';
import { UpsertPedidoDraftDto } from '../dto/upsert-pedido-draft.dto';
import { PedidoDraftResponseDto } from '../dto/pedido-draft-response.dto';
import { PurchaseBatch } from '../../pedido/purchase-batch.entity/purchase-batch.entity';
import { PedidoDraftRecord } from '../interfaces/pedido-draft-record.interface';

@ApiTags('Pedido Draft')
@UseGuards(JwtAuthGuard)
@Controller('pedido/draft')
export class PedidoDraftController {
  constructor(private readonly pedidoDraftService: PedidoDraftService) {}

  @Post()
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

  @Get()
  @ApiOperation({
    summary: 'Recuperar el borrador de creación de pedido más reciente',
  })
  @ApiOkResponse({ type: PedidoDraftResponseDto })
  getLatestDraft(
    @Request() req: { user: { id: string } }
  ): Promise<PedidoDraftRecord | null> {
    return this.pedidoDraftService.getLatestDraft(req.user.id);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar el borrador activo de creación de pedido',
  })
  async clearDraft(@Request() req: { user: { id: string } }): Promise<void> {
    await this.pedidoDraftService.clearDraft(req.user.id);
  }

  @Post('finalize')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Finalizar la creación del pedido a partir del borrador persistido',
  })
  @ApiOkResponse({ type: PurchaseBatch })
  async finalizeOrder(
    @Request() req: { user: { id: string } }
  ): Promise<PurchaseBatch> {
    return this.pedidoDraftService.finalizeOrder(req.user.id);
  }
}

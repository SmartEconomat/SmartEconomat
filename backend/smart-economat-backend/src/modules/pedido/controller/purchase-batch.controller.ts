import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PurchaseBatchService } from '../service/purchase-batch.service';
import {
  CreatePurchaseBatchDto,
  ConsolidatePurchaseBatchDto,
  UpdatePurchaseBatchDto,
  CancelPurchaseBatchDto,
} from '../dto/create-purchase-batch.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermisosGuard } from '../../auth/guards/auth-permissions.guard';
import { PdfReportService } from '../../recepcion/service/pdf-report.service';
import {
  RecepcionReportePdfDto,
  TipoReportePdf,
} from '../../recepcion/dto/recepcion-reporte-pdf.dto';
import { Res, Query } from '@nestjs/common';
import type { Response } from 'express';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { ParseUUIDv7Pipe } from '../../../common/pipes';
import { CreateMissingStockBatchDto } from '../dto/create-missing-stock-batch.dto';
import { GeneratePedidoFromRecetasDto } from '../dto/generate-pedido-from-recetas.dto';
import { RecetaToPedidoService } from '../service/receta-to-pedido.service';
import { PERMISSIONS } from '../../../common/constants/permissions.constants';
import { SortableFields } from '../../../common/decorators/sortable-fields.decorator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { SORTABLE_FIELDS } from '../../../common/constants/sortable-fields.constants';
import { PurchaseBatch } from '../purchase-batch.entity/purchase-batch.entity';

type PurchaseBatchRequest = {
  user: { id: string };
};

/** Clase pública (PurchaseBatchController). Paquete: smart-economat-backend (Nest). */
@ApiTags('purchase-batches')
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('purchase-batches')
export class PurchaseBatchController {
  /**
   * Construye la instancia configurada.
   * @undefined {PurchaseBatchService} batchService - Entrada efectiva esperada por el contrato.
   * @undefined {PdfReportService} pdfReportService - Entrada efectiva esperada por el contrato.
   * @undefined {RecetaToPedidoService} recetaToPedidoService - Entrada efectiva esperada por el contrato.
   */
  constructor(
    private readonly batchService: PurchaseBatchService,
    private readonly pdfReportService: PdfReportService,
    private readonly recetaToPedidoService: RecetaToPedidoService
  ) {}

  /**
   * Crea recursos nuevos en base a las reglas de negocio.
   * @undefined {CreatePurchaseBatchDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {PurchaseBatchRequest} req - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/pedido/purchase-batch.entity/purchase-batch.entity").PurchaseBatch>} Datos efectivos después de ejecutar la operación.
   */
  @Post()
  @RequirePermissions(PERMISSIONS.pedidos.crear)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreatePurchaseBatchDto,
    @Request() req: PurchaseBatchRequest
  ) {
    const userId = req.user.id;

    return this.batchService.createBatchOrder(dto, userId);
  }

  /**
   * Crea recursos nuevos en base a las reglas de negocio.
   * @undefined {CreateMissingStockBatchDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {any} req - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/pedido/purchase-batch.entity/purchase-batch.entity").PurchaseBatch>} Datos efectivos después de ejecutar la operación.
   */
  @Post('from-missing-stock')
  @RequirePermissions(PERMISSIONS.pedidos.crear)
  @HttpCode(HttpStatus.CREATED)
  createFromMissingStock(
    @Body() dto: CreateMissingStockBatchDto,
    @Request() req: any
  ) {
    const userId = req.user.id as string;

    return this.batchService.createBatchOrderFromMissingStock(dto, userId);
  }

  /**
   * Crea recursos nuevos en base a las reglas de negocio.
   * @undefined {GeneratePedidoFromRecetasDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {any} req - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/pedido/purchase-batch.entity/purchase-batch.entity").PurchaseBatch>} Datos efectivos después de ejecutar la operación.
   */
  @Post('from-recipes')
  @RequirePermissions(PERMISSIONS.pedidos.crear)
  @HttpCode(HttpStatus.CREATED)
  async createFromRecipes(
    @Body() dto: GeneratePedidoFromRecetasDto,
    @Request() req: any
  ) {
    const userId = req.user.id as string;
    const batchDto =
      await this.recetaToPedidoService.buildBatchOrderFromRecetas(dto);

    return this.batchService.createBatchOrder(batchDto, userId);
  }

  /**
   * Lista paginada de lotes de compra.
   */
  @Get()
  @RequirePermissions(PERMISSIONS.pedidos.listar)
  findAll(
    @SortableFields(SORTABLE_FIELDS.purchaseBatches)
    query: PaginationQueryDto
  ): Promise<PaginatedResponseDto<PurchaseBatch>> {
    return this.batchService.findAllPaginated(query);
  }

  /**
   * Expone "consolidate" en smart-economat-backend (Nest).
   * @undefined {ConsolidatePurchaseBatchDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {any} req - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/pedido/purchase-batch.entity/purchase-batch.entity").PurchaseBatch>} Datos efectivos después de ejecutar la operación.
   */
  @Post('consolidate')
  @RequirePermissions(PERMISSIONS.pedidos.crear)
  @HttpCode(HttpStatus.CREATED)
  consolidate(@Body() dto: ConsolidatePurchaseBatchDto, @Request() req: any) {
    const userId = req.user.id as string;
    return this.batchService.consolidateExistingOrders(dto, userId);
  }

  /**
   * Expone "markAsProcessed" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {PurchaseBatchRequest} req - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/pedido/purchase-batch.entity/purchase-batch.entity").PurchaseBatch>} Datos efectivos después de ejecutar la operación.
   */
  @Patch(':id/tramitar')
  @RequirePermissions(PERMISSIONS.pedidos.editar)
  markAsProcessed(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Request() req: PurchaseBatchRequest
  ) {
    return this.batchService.acceptBatchOrder(id, req.user.id);
  }

  /**
   * Expone "findOne" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/pedido/purchase-batch.entity/purchase-batch.entity").PurchaseBatch>} Datos efectivos después de ejecutar la operación.
   */
  @Get(':id')
  @RequirePermissions(PERMISSIONS.pedidos.ver)
  findOne(@Param('id', ParseUUIDv7Pipe) id: string) {
    return this.batchService.findOne(id);
  }

  /**
   * Persiste modificaciones válidas sobre entidades existentes.
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {UpdatePurchaseBatchDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {PurchaseBatchRequest} req - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/pedido/purchase-batch.entity/purchase-batch.entity").PurchaseBatch>} Datos efectivos después de ejecutar la operación.
   */
  @Patch(':id')
  @RequirePermissions(PERMISSIONS.pedidos.editar)
  update(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Body() dto: UpdatePurchaseBatchDto,
    @Request() req: PurchaseBatchRequest
  ) {
    return this.batchService.updateBatchOrder(id, dto, req.user.id);
  }

  /**
   * Expone "accept" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {PurchaseBatchRequest} req - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/pedido/purchase-batch.entity/purchase-batch.entity").PurchaseBatch>} Datos efectivos después de ejecutar la operación.
   */
  @Patch(':id/aceptar')
  @RequirePermissions(PERMISSIONS.pedidos.editar)
  accept(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Request() req: PurchaseBatchRequest
  ) {
    return this.batchService.approveBatchOrder(id, req.user.id);
  }

  /**
   * Expone "cancel" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {CancelPurchaseBatchDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {PurchaseBatchRequest} req - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/pedido/purchase-batch.entity/purchase-batch.entity").PurchaseBatch>} Datos efectivos después de ejecutar la operación.
   */
  @Patch(':id/cancelar')
  @RequirePermissions(PERMISSIONS.pedidos.cancelar)
  cancel(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Body() dto: CancelPurchaseBatchDto,
    @Request() req: PurchaseBatchRequest
  ) {
    return this.batchService.cancelBatchOrder(id, dto, req.user.id);
  }

  /**
   * Expone "restore" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {PurchaseBatchRequest} req - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/pedido/purchase-batch.entity/purchase-batch.entity").PurchaseBatch>} Datos efectivos después de ejecutar la operación.
   */
  @Patch(':id/restaurar')
  @RequirePermissions(PERMISSIONS.pedidos.restaurar)
  restore(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Request() req: PurchaseBatchRequest
  ) {
    return this.batchService.restoreBatchOrder(id, req.user.id);
  }

  /**
   * Genera artefactos sintéticos a partir del estado conocido.
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {RecepcionReportePdfDto} query - Entrada efectiva esperada por el contrato.
   * @undefined {Response<any, Record<string, any>>} res - Entrada efectiva esperada por el contrato.
   * @undefined {PurchaseBatchRequest} req - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
   */
  @Get(':id/pdf')
  @RequirePermissions(PERMISSIONS.pedidos.ver)
  async generatePdf(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Query() query: RecepcionReportePdfDto,
    @Res() res: Response
  ) {
    query.batchId = id;
    query.tipo = TipoReportePdf.PEDIDO;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="lote-${id.slice(0, 8)}.pdf"`
    );
    await this.pdfReportService.generateReport(query, res);
  }
}

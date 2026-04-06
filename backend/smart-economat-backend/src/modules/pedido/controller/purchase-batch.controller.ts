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
  Logger,
} from '@nestjs/common';
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

type PurchaseBatchRequest = {
  user: { id: string };
  url: string;
};

@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('purchase-batches')
export class PurchaseBatchController {
  constructor(
    private readonly batchService: PurchaseBatchService,
    private readonly pdfReportService: PdfReportService,
    private readonly recetaToPedidoService: RecetaToPedidoService
  ) {}

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

  @Get()
  @RequirePermissions(PERMISSIONS.pedidos.listar)
  findAll() {
    return this.batchService.findAll();
  }

  @Post('consolidate')
  @RequirePermissions(PERMISSIONS.pedidos.crear)
  @HttpCode(HttpStatus.CREATED)
  consolidate(@Body() dto: ConsolidatePurchaseBatchDto, @Request() req: any) {
    const userId = req.user.id as string;
    return this.batchService.consolidateExistingOrders(dto, userId);
  }

  @Patch(':id/tramitar')
  @RequirePermissions(PERMISSIONS.pedidos.editar)
  markAsProcessed(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Request() req: PurchaseBatchRequest
  ) {
    return this.batchService.acceptBatchOrder(id, req.user.id);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.pedidos.ver)
  findOne(@Param('id', ParseUUIDv7Pipe) id: string) {
    return this.batchService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.pedidos.editar)
  update(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Body() dto: UpdatePurchaseBatchDto,
    @Request() req: PurchaseBatchRequest
  ) {
    return this.batchService.updateBatchOrder(id, dto, req.user.id);
  }

  @Patch(':id/aceptar')
  @RequirePermissions(PERMISSIONS.pedidos.editar)
  accept(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Request() req: PurchaseBatchRequest
  ) {
    return this.batchService.approveBatchOrder(id, req.user.id);
  }

  @Patch(':id/cancelar')
  @RequirePermissions(PERMISSIONS.pedidos.cancelar)
  cancel(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Body() dto: CancelPurchaseBatchDto,
    @Request() req: PurchaseBatchRequest
  ) {
    return this.batchService.cancelBatchOrder(id, dto, req.user.id);
  }

  @Patch(':id/restaurar')
  @RequirePermissions(PERMISSIONS.pedidos.restaurar)
  restore(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Request() req: PurchaseBatchRequest
  ) {
    return this.batchService.restoreBatchOrder(id, req.user.id);
  }

  @Get(':id/pdf')
  @RequirePermissions(PERMISSIONS.pedidos.ver)
  async generatePdf(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Query() query: RecepcionReportePdfDto,
    @Res() res: Response,
    @Request() req: PurchaseBatchRequest
  ) {
    const logger = new Logger('PurchaseBatchController');
    logger.debug(`generatePdf: RAW URL=${req.url}`);
    logger.debug(`generatePdf: Initial Query=${JSON.stringify(query)}`);

    const url = new URL(String(req.url), 'http://localhost');
    const qIncluir = url.searchParams.get('incluirCancelados');
    const qPagina = url.searchParams.get('paginaPorProveedor');

    if (qIncluir !== null) {
      query.incluirCancelados = qIncluir === 'true';
    }
    if (qPagina !== null) {
      query.paginaPorProveedor = qPagina === 'true';
    }

    logger.debug(
      `generatePdf: Final Query after fallback=${JSON.stringify(query)}`
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="lote-${id.slice(0, 8)}.pdf"`
    );
    query.batchId = id;
    query.tipo = TipoReportePdf.PEDIDO;
    await this.pdfReportService.generateReport(query, res);
  }
}

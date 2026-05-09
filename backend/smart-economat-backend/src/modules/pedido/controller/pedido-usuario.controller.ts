import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';

type PedidoUsuarioRequest = {
  user: { id: string; rol?: string };
  url: string;
};
import { SortableFields } from '../../../common/decorators/sortable-fields.decorator';
import {
  RequirePermissions,
  RequireAnyPermission,
} from '../../../common/decorators/require-permissions.decorator';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { ParseUUIDv7Pipe } from '../../../common/pipes';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermisosGuard } from '../../auth/guards/auth-permissions.guard';
import { PedidoDraftService } from '../../pedido-draft/service/pedido-draft.service';
import { PdfReportService } from '../../recepcion/service/pdf-report.service';
import {
  RecepcionReportePdfDto,
  TipoReportePdf,
} from '../../recepcion/dto/recepcion-reporte-pdf.dto';
import { CreateMissingStockBatchDto } from '../dto/create-missing-stock-batch.dto';
import { GeneratePedidoFromRecetasDto } from '../dto/generate-pedido-from-recetas.dto';
import {
  CancelPedidoUsuarioDto,
  CreatePedidoUsuarioDto,
  PedidoUsuarioPdfDto,
  PedidoUsuarioQueryDto,
  UpdatePedidoUsuarioDto,
} from '../dto/pedido-usuario.dto';
import { PedidoUsuario } from '../pedido-usuario.entity/pedido-usuario.entity';
import { PurchaseBatchService } from '../service/purchase-batch.service';
import { PedidoUsuarioService } from '../service/pedido-usuario.service';
import { RecetaToPedidoService } from '../service/receta-to-pedido.service';
import { PERMISSIONS } from '../../../common/constants/permissions.constants';
import { SORTABLE_FIELDS } from '../../../common/constants/sortable-fields.constants';

/** Clase pública (PedidoUsuarioController). Paquete: smart-economat-backend (Nest). */
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('pedido-usuarios')
export class PedidoUsuarioController {
  /**
   * Construye la instancia configurada.
   * @undefined {PedidoUsuarioService} pedidoUsuarioService - Entrada efectiva esperada por el contrato.
   * @undefined {PedidoDraftService} pedidoDraftService - Entrada efectiva esperada por el contrato.
   * @undefined {PdfReportService} pdfReportService - Entrada efectiva esperada por el contrato.
   * @undefined {PurchaseBatchService} purchaseBatchService - Entrada efectiva esperada por el contrato.
   * @undefined {RecetaToPedidoService} recetaToPedidoService - Entrada efectiva esperada por el contrato.
   */
  constructor(
    private readonly pedidoUsuarioService: PedidoUsuarioService,
    private readonly pedidoDraftService: PedidoDraftService,
    private readonly pdfReportService: PdfReportService,
    private readonly purchaseBatchService: PurchaseBatchService,
    private readonly recetaToPedidoService: RecetaToPedidoService
  ) {}

  /**
   * Crea recursos nuevos en base a las reglas de negocio.
   * @undefined {CreatePedidoUsuarioDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {PedidoUsuarioRequest} req - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<PedidoUsuario>} Datos efectivos después de ejecutar la operación.
   */
  @Post()
  @RequirePermissions(PERMISSIONS.pedidos.crear)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreatePedidoUsuarioDto,
    @Req() req: PedidoUsuarioRequest
  ) {
    return this.pedidoDraftService.saveAndFinalize(req.user.id, dto);
  }

  /**
   * Crea recursos nuevos en base a las reglas de negocio.
   * @undefined {CreateMissingStockBatchDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {PedidoUsuarioRequest} req - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<PedidoUsuario>} Datos efectivos después de ejecutar la operación.
   */
  @Post('from-missing-stock')
  @RequirePermissions(PERMISSIONS.pedidos.crear)
  @HttpCode(HttpStatus.CREATED)
  async createFromMissingStock(
    @Body() dto: CreateMissingStockBatchDto,
    @Req() req: PedidoUsuarioRequest
  ): Promise<PedidoUsuario> {
    const pedidoUsuarioDto =
      await this.purchaseBatchService.buildPedidoUsuarioDtoFromMissingStock(
        dto
      );

    return this.pedidoUsuarioService.create(pedidoUsuarioDto, req.user.id);
  }

  /**
   * Crea recursos nuevos en base a las reglas de negocio.
   * @undefined {GeneratePedidoFromRecetasDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {PedidoUsuarioRequest} req - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<PedidoUsuario>} Datos efectivos después de ejecutar la operación.
   */
  @Post('from-recipes')
  @RequirePermissions(PERMISSIONS.pedidos.crear)
  @HttpCode(HttpStatus.CREATED)
  async createFromRecipes(
    @Body() dto: GeneratePedidoFromRecetasDto,
    @Req() req: PedidoUsuarioRequest
  ): Promise<PedidoUsuario> {
    const pedidoUsuarioDto =
      await this.recetaToPedidoService.buildBatchOrderFromRecetas(dto);

    return this.pedidoUsuarioService.create(pedidoUsuarioDto, req.user.id);
  }

  /**
   * Expone "findAll" en smart-economat-backend (Nest).
   * @undefined {PedidoUsuarioQueryDto} query - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<PaginatedResponseDto<PedidoUsuario>>} Datos efectivos después de ejecutar la operación.
   */
  @Get()
  @RequirePermissions(PERMISSIONS.pedidos.listar)
  findAll(
    @SortableFields(SORTABLE_FIELDS.pedidoUsuarios)
    query: PedidoUsuarioQueryDto
  ): Promise<PaginatedResponseDto<PedidoUsuario>> {
    return this.pedidoUsuarioService.findAll(query);
  }

  /**
   * Expone "findOne" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<PedidoUsuario>} Datos efectivos después de ejecutar la operación.
   */
  @Get(':id')
  @RequirePermissions(PERMISSIONS.pedidos.ver)
  findOne(@Param('id', ParseUUIDv7Pipe) id: string): Promise<PedidoUsuario> {
    return this.pedidoUsuarioService.findOne(id);
  }

  /**
   * Persiste modificaciones válidas sobre entidades existentes.
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {UpdatePedidoUsuarioDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {PedidoUsuarioRequest} req - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<PedidoUsuario>} Datos efectivos después de ejecutar la operación.
   */
  @Patch(':id')
  @RequirePermissions(PERMISSIONS.pedidos.editar)
  update(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Body() dto: UpdatePedidoUsuarioDto,
    @Req() req: PedidoUsuarioRequest
  ) {
    return this.pedidoUsuarioService.update(id, dto, req.user.id);
  }

  /**
   * Expone "accept" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {PedidoUsuarioRequest} req - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<PedidoUsuario>} Datos efectivos después de ejecutar la operación.
   */
  @Patch(':id/aceptar')
  @RequirePermissions(PERMISSIONS.pedidos.editar)
  accept(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Req() req: PedidoUsuarioRequest
  ) {
    return this.pedidoUsuarioService.accept(id, req.user.id);
  }

  /**
   * Expone "cancel" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {CancelPedidoUsuarioDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {PedidoUsuarioRequest} req - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<PedidoUsuario>} Datos efectivos después de ejecutar la operación.
   */
  @Patch(':id/cancelar')
  @RequirePermissions(PERMISSIONS.pedidos.cancelar)
  cancel(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Body() dto: CancelPedidoUsuarioDto,
    @Req() req: PedidoUsuarioRequest
  ) {
    return this.pedidoUsuarioService.cancel(id, dto, req.user.id);
  }

  /**
   * Expone "restore" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {PedidoUsuarioRequest} req - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<PedidoUsuario>} Datos efectivos después de ejecutar la operación.
   */
  @Patch(':id/restaurar')
  @RequirePermissions(PERMISSIONS.pedidos.restaurar)
  restore(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Req() req: PedidoUsuarioRequest
  ) {
    return this.pedidoUsuarioService.restore(id, req.user.id);
  }

  /**
   * Genera artefactos sintéticos a partir del estado conocido.
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {PedidoUsuarioPdfDto} _query - Entrada efectiva esperada por el contrato.
   * @undefined {Response<any, Record<string, any>>} res - Entrada efectiva esperada por el contrato.
   * @undefined {PedidoUsuarioRequest} req - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
   */
  @Get(':id/pdf')
  @RequirePermissions(PERMISSIONS.pedidos.ver)
  async generatePdf(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Query() _query: PedidoUsuarioPdfDto,
    @Res() res: Response,
    @Req() req: PedidoUsuarioRequest
  ) {
    const logger = new Logger(PedidoUsuarioController.name);
    logger.debug(`generatePdf pedidoUsuario: RAW URL=${req.url}`);

    const url = new URL(req.url, 'http://localhost');
    const qIncluir = url.searchParams.get('incluirCancelados');
    const qPagina = url.searchParams.get('paginaPorProveedor');

    const reportQuery = new RecepcionReportePdfDto();
    if (qIncluir !== null) {
      reportQuery.incluirCancelados = qIncluir === 'true';
    }
    if (qPagina !== null) {
      reportQuery.paginaPorProveedor = qPagina === 'true';
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="pedido-${id.slice(0, 8)}.pdf"`
    );
    reportQuery.pedidoUsuarioId = id;
    reportQuery.tipo = TipoReportePdf.PEDIDO;
    await this.pdfReportService.generateReport(reportQuery, res);
  }

  /**
   * Expone "remove" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {PedidoUsuarioRequest} req - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
   */
  @Delete(':id')
  @RequireAnyPermission(
    PERMISSIONS.pedidos.eliminar,
    PERMISSIONS.pedidos.listar
  )
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Req() req: PedidoUsuarioRequest
  ) {
    return this.pedidoUsuarioService.remove(id, req.user);
  }
}

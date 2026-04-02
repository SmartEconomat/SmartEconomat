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
import {
  CancelPedidoUsuarioDto,
  CreatePedidoUsuarioDto,
  PedidoUsuarioPdfDto,
  PedidoUsuarioQueryDto,
  UpdatePedidoUsuarioDto,
} from '../dto/pedido-usuario.dto';
import { PedidoUsuario } from '../pedido-usuario.entity/pedido-usuario.entity';
import { PedidoUsuarioService } from '../service/pedido-usuario.service';

@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('pedido-usuarios')
export class PedidoUsuarioController {
  constructor(
    private readonly pedidoUsuarioService: PedidoUsuarioService,
    private readonly pedidoDraftService: PedidoDraftService,
    private readonly pdfReportService: PdfReportService
  ) {}

  @Post()
  @RequirePermissions('pedidos:crear')
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreatePedidoUsuarioDto,
    @Req() req: PedidoUsuarioRequest
  ) {
    return this.pedidoDraftService.saveAndFinalize(req.user.id, dto);
  }

  @Get()
  @RequirePermissions('pedidos:listar')
  findAll(
    @SortableFields({
      fechaPedido: 'fechaPedido',
      fechaEntrega: 'fechaEntrega',
      costeTotal: 'costeTotal',
      estado: 'estado',
      numeroGlobal: 'numeroGlobal',
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    })
    query: PedidoUsuarioQueryDto
  ): Promise<PaginatedResponseDto<PedidoUsuario>> {
    return this.pedidoUsuarioService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('pedidos:ver')
  findOne(@Param('id', ParseUUIDv7Pipe) id: string): Promise<PedidoUsuario> {
    return this.pedidoUsuarioService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('pedidos:editar')
  update(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Body() dto: UpdatePedidoUsuarioDto
  ) {
    return this.pedidoUsuarioService.update(id, dto);
  }

  @Patch(':id/aceptar')
  @RequirePermissions('pedidos:editar')
  accept(@Param('id', ParseUUIDv7Pipe) id: string) {
    return this.pedidoUsuarioService.accept(id);
  }

  @Patch(':id/cancelar')
  @RequirePermissions('pedidos:cancelar')
  cancel(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Body() dto: CancelPedidoUsuarioDto
  ) {
    return this.pedidoUsuarioService.cancel(id, dto);
  }

  @Patch(':id/restaurar')
  @RequirePermissions('pedidos:restaurar')
  restore(@Param('id', ParseUUIDv7Pipe) id: string) {
    return this.pedidoUsuarioService.restore(id);
  }

  @Get(':id/pdf')
  @RequirePermissions('pedidos:ver')
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

  @Delete(':id')
  @RequireAnyPermission('pedidos:eliminar', 'pedidos:listar')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Req() req: PedidoUsuarioRequest
  ) {
    return this.pedidoUsuarioService.remove(id, req.user);
  }
}

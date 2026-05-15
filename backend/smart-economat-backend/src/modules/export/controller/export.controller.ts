import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermisosGuard } from '../../auth/guards/auth-permissions.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { PERMISSIONS } from '../../../common/constants/permissions.constants';
import { ExportService } from '../service/export.service';
import { ExportAlbaranFilterDto } from '../dto/export-albaran-filter.dto';
import { ExportIncidenciaFilterDto } from '../dto/export-incidencia-filter.dto';
import { ExportInventarioFilterDto } from '../dto/export-inventario-filter.dto';
import { ExportMovimientoFilterDto } from '../dto/export-movimiento-filter.dto';
import { ExportPedidoFilterDto } from '../dto/export-pedido-filter.dto';
import { ExportProductoFilterDto } from '../dto/export-producto-filter.dto';
import { ExportProveedorFilterDto } from '../dto/export-proveedor-filter.dto';
import { ExportRecepcionFilterDto } from '../dto/export-recepcion-filter.dto';
import { ExportRecetaFilterDto } from '../dto/export-receta-filter.dto';
import { ExportUbicacionFilterDto } from '../dto/export-ubicacion-filter.dto';
import { ExportUsuarioFilterDto } from '../dto/export-usuario-filter.dto';
import { validateDateRange } from '../../../common/utils/date-range.util';

const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const PDF_MIME = 'application/pdf';

/**
 * Controlador transversal de exportación a Excel y PDF.
 * Todos los endpoints devuelven un stream binario (no JSON envelope) — el cliente debe
 * usar blob/arrayBuffer para procesar la respuesta.
 */
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('productos/xlsx')
  @RequirePermissions(PERMISSIONS.productos.listar)
  async exportProductos(
    @Query() query: ExportProductoFilterDto,
    @Res() res: Response
  ): Promise<void> {
    res.setHeader('Content-Type', XLSX_MIME);
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="productos.xlsx"'
    );
    await this.exportService.streamProductosToExcel(query, res);
  }

  @Get('pedidos/xlsx')
  @RequirePermissions(PERMISSIONS.pedidos.listar)
  async exportPedidos(
    @Query() query: ExportPedidoFilterDto,
    @Res() res: Response
  ): Promise<void> {
    validateDateRange(
      query.fechaDesde,
      query.fechaHasta,
      365,
      'Exportación de Pedidos'
    );
    res.setHeader('Content-Type', XLSX_MIME);
    res.setHeader('Content-Disposition', 'attachment; filename="pedidos.xlsx"');
    await this.exportService.streamPedidosToExcel(query, res);
  }

  @Get('proveedores/xlsx')
  @RequirePermissions(PERMISSIONS.proveedores.listar)
  async exportProveedores(
    @Query() query: ExportProveedorFilterDto,
    @Res() res: Response
  ): Promise<void> {
    res.setHeader('Content-Type', XLSX_MIME);
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="proveedores.xlsx"'
    );
    await this.exportService.streamProveedoresToExcel(query, res);
  }

  @Get('albaranes/xlsx')
  @RequirePermissions(PERMISSIONS.albaranes.listar)
  async exportAlbaranes(
    @Query() query: ExportAlbaranFilterDto,
    @Res() res: Response
  ): Promise<void> {
    validateDateRange(
      query.fechaDesde,
      query.fechaHasta,
      365,
      'Exportación de Albaranes'
    );
    res.setHeader('Content-Type', XLSX_MIME);
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="albaranes.xlsx"'
    );
    await this.exportService.streamAlbaranesToExcel(query, res);
  }

  @Get('incidencias/xlsx')
  @RequirePermissions(PERMISSIONS.incidencias.listar)
  async exportIncidencias(
    @Query() query: ExportIncidenciaFilterDto,
    @Res() res: Response
  ): Promise<void> {
    validateDateRange(
      query.startDate,
      query.endDate,
      365,
      'Exportación de Incidencias'
    );
    res.setHeader('Content-Type', XLSX_MIME);
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="incidencias.xlsx"'
    );
    await this.exportService.streamIncidenciasToExcel(query, res);
  }

  @Get('inventario/xlsx')
  @RequirePermissions(PERMISSIONS.inventario.listar)
  async exportInventario(
    @Query() query: ExportInventarioFilterDto,
    @Res() res: Response
  ): Promise<void> {
    res.setHeader('Content-Type', XLSX_MIME);
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="inventario.xlsx"'
    );
    await this.exportService.streamInventarioToExcel(query, res);
  }

  @Get('movimientos/xlsx')
  @RequirePermissions(PERMISSIONS.movimientos.listar)
  async exportMovimientos(
    @Query() query: ExportMovimientoFilterDto,
    @Res() res: Response
  ): Promise<void> {
    validateDateRange(
      query.fechaDesde,
      query.fechaHasta,
      365,
      'Exportación de Movimientos'
    );
    res.setHeader('Content-Type', XLSX_MIME);
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="movimientos.xlsx"'
    );
    await this.exportService.streamMovimientosToExcel(query, res);
  }

  @Get('recepciones/xlsx')
  @RequirePermissions(PERMISSIONS.recepciones.listar)
  async exportRecepciones(
    @Query() query: ExportRecepcionFilterDto,
    @Res() res: Response
  ): Promise<void> {
    validateDateRange(
      query.fechaDesde,
      query.fechaHasta,
      365,
      'Exportación de Recepciones'
    );
    res.setHeader('Content-Type', XLSX_MIME);
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="recepciones.xlsx"'
    );
    await this.exportService.streamRecepcionesToExcel(query, res);
  }

  @Get('recetas/xlsx')
  @RequirePermissions(PERMISSIONS.recetas.listar)
  async exportRecetas(
    @Query() query: ExportRecetaFilterDto,
    @Res() res: Response
  ): Promise<void> {
    res.setHeader('Content-Type', XLSX_MIME);
    res.setHeader('Content-Disposition', 'attachment; filename="recetas.xlsx"');
    await this.exportService.streamRecetasToExcel(query, res);
  }

  @Get('ubicaciones/xlsx')
  @RequirePermissions(PERMISSIONS.ubicaciones.listar)
  async exportUbicaciones(
    @Query() query: ExportUbicacionFilterDto,
    @Res() res: Response
  ): Promise<void> {
    res.setHeader('Content-Type', XLSX_MIME);
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="ubicaciones.xlsx"'
    );
    await this.exportService.streamUbicacionesToExcel(query, res);
  }

  @Get('usuarios/xlsx')
  @RequirePermissions(PERMISSIONS.usuarios.listar)
  async exportUsuarios(
    @Query() query: ExportUsuarioFilterDto,
    @Res() res: Response
  ): Promise<void> {
    res.setHeader('Content-Type', XLSX_MIME);
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="usuarios.xlsx"'
    );
    await this.exportService.streamUsuariosToExcel(query, res);
  }

  @Get('productos/pdf')
  @RequirePermissions(PERMISSIONS.productos.listar)
  async exportProductosPdf(
    @Query() query: ExportProductoFilterDto,
    @Res() res: Response
  ): Promise<void> {
    res.setHeader('Content-Type', PDF_MIME);
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="productos.pdf"'
    );
    await this.exportService.streamProductosToPdf(query, res);
  }

  @Get('proveedores/pdf')
  @RequirePermissions(PERMISSIONS.proveedores.listar)
  async exportProveedoresPdf(
    @Query() query: ExportProveedorFilterDto,
    @Res() res: Response
  ): Promise<void> {
    res.setHeader('Content-Type', PDF_MIME);
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="proveedores.pdf"'
    );
    await this.exportService.streamProveedoresToPdf(query, res);
  }

  @Get('inventario/pdf')
  @RequirePermissions(PERMISSIONS.inventario.listar)
  async exportInventarioPdf(
    @Query() query: ExportInventarioFilterDto,
    @Res() res: Response
  ): Promise<void> {
    res.setHeader('Content-Type', PDF_MIME);
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="inventario.pdf"'
    );
    await this.exportService.streamInventarioToPdf(query, res);
  }

  @Get('pedidos/pdf')
  @RequirePermissions(PERMISSIONS.pedidos.listar)
  async exportPedidosPdf(
    @Query() query: ExportPedidoFilterDto,
    @Res() res: Response
  ): Promise<void> {
    res.setHeader('Content-Type', PDF_MIME);
    validateDateRange(
      query.fechaDesde,
      query.fechaHasta,
      365,
      'Exportación de Pedidos PDF'
    );
    res.setHeader('Content-Disposition', 'attachment; filename="pedidos.pdf"');
    await this.exportService.streamPedidosToPdf(query, res);
  }

  @Get('albaranes/pdf')
  @RequirePermissions(PERMISSIONS.albaranes.listar)
  async exportAlbaranesPdf(
    @Query() query: ExportAlbaranFilterDto,
    @Res() res: Response
  ): Promise<void> {
    res.setHeader('Content-Type', PDF_MIME);
    validateDateRange(
      query.fechaDesde,
      query.fechaHasta,
      365,
      'Exportación de Albaranes PDF'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="albaranes.pdf"'
    );
    await this.exportService.streamAlbaranesToPdf(query, res);
  }

  @Get('incidencias/pdf')
  @RequirePermissions(PERMISSIONS.incidencias.listar)
  async exportIncidenciasPdf(
    @Query() query: ExportIncidenciaFilterDto,
    @Res() res: Response
  ): Promise<void> {
    res.setHeader('Content-Type', PDF_MIME);
    validateDateRange(
      query.startDate,
      query.endDate,
      365,
      'Exportación de Incidencias PDF'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="incidencias.pdf"'
    );
    await this.exportService.streamIncidenciasToPdf(query, res);
  }

  @Get('recetas/pdf')
  @RequirePermissions(PERMISSIONS.recetas.listar)
  async exportRecetasPdf(
    @Query() query: ExportRecetaFilterDto,
    @Res() res: Response
  ): Promise<void> {
    res.setHeader('Content-Type', PDF_MIME);
    res.setHeader('Content-Disposition', 'attachment; filename="recetas.pdf"');
    await this.exportService.streamRecetasToPdf(query, res);
  }
}

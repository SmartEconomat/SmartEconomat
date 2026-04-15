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

const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const PDF_MIME = 'application/pdf';

/**
 * Controller that exposes endpoints for exporting entity data as XLSX or PDF downloads.
 * All endpoints require JWT authentication and entity-specific list permissions.
 * @class ExportController
 */
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  /**
   * Exports the productos dataset as an XLSX file download.
   * @param {ExportProductoFilterDto} query - Optional filter criteria for the export.
   * @param {Response} res - Express response used to stream the file.
   * @returns {Promise<void>}
   */
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

  /**
   * Exports the pedidos dataset as an XLSX file download.
   * @param {ExportPedidoFilterDto} query - Optional filter criteria for the export.
   * @param {Response} res - Express response used to stream the file.
   * @returns {Promise<void>}
   */
  @Get('pedidos/xlsx')
  @RequirePermissions(PERMISSIONS.pedidos.listar)
  async exportPedidos(
    @Query() query: ExportPedidoFilterDto,
    @Res() res: Response
  ): Promise<void> {
    res.setHeader('Content-Type', XLSX_MIME);
    res.setHeader('Content-Disposition', 'attachment; filename="pedidos.xlsx"');
    await this.exportService.streamPedidosToExcel(query, res);
  }

  /**
   * Exports the proveedores dataset as an XLSX file download.
   * @param {ExportProveedorFilterDto} query - Optional filter criteria for the export.
   * @param {Response} res - Express response used to stream the file.
   * @returns {Promise<void>}
   */
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

  /**
   * Exports the albaranes dataset as an XLSX file download.
   * @param {ExportAlbaranFilterDto} query - Optional filter criteria for the export.
   * @param {Response} res - Express response used to stream the file.
   * @returns {Promise<void>}
   */
  @Get('albaranes/xlsx')
  @RequirePermissions(PERMISSIONS.albaranes.listar)
  async exportAlbaranes(
    @Query() query: ExportAlbaranFilterDto,
    @Res() res: Response
  ): Promise<void> {
    res.setHeader('Content-Type', XLSX_MIME);
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="albaranes.xlsx"'
    );
    await this.exportService.streamAlbaranesToExcel(query, res);
  }

  /**
   * Exports the incidencias dataset as an XLSX file download.
   * @param {ExportIncidenciaFilterDto} query - Optional filter criteria for the export.
   * @param {Response} res - Express response used to stream the file.
   * @returns {Promise<void>}
   */
  @Get('incidencias/xlsx')
  @RequirePermissions(PERMISSIONS.incidencias.listar)
  async exportIncidencias(
    @Query() query: ExportIncidenciaFilterDto,
    @Res() res: Response
  ): Promise<void> {
    res.setHeader('Content-Type', XLSX_MIME);
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="incidencias.xlsx"'
    );
    await this.exportService.streamIncidenciasToExcel(query, res);
  }

  /**
   * Exports the inventario dataset as an XLSX file download.
   * @param {ExportInventarioFilterDto} query - Optional filter criteria for the export.
   * @param {Response} res - Express response used to stream the file.
   * @returns {Promise<void>}
   */
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

  /**
   * Exports the movimientos dataset as an XLSX file download.
   * @param {ExportMovimientoFilterDto} query - Optional filter criteria for the export.
   * @param {Response} res - Express response used to stream the file.
   * @returns {Promise<void>}
   */
  @Get('movimientos/xlsx')
  @RequirePermissions(PERMISSIONS.movimientos.listar)
  async exportMovimientos(
    @Query() query: ExportMovimientoFilterDto,
    @Res() res: Response
  ): Promise<void> {
    res.setHeader('Content-Type', XLSX_MIME);
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="movimientos.xlsx"'
    );
    await this.exportService.streamMovimientosToExcel(query, res);
  }

  /**
   * Exports the recepciones dataset as an XLSX file download.
   * @param {ExportRecepcionFilterDto} query - Optional filter criteria for the export.
   * @param {Response} res - Express response used to stream the file.
   * @returns {Promise<void>}
   */
  @Get('recepciones/xlsx')
  @RequirePermissions(PERMISSIONS.recepciones.listar)
  async exportRecepciones(
    @Query() query: ExportRecepcionFilterDto,
    @Res() res: Response
  ): Promise<void> {
    res.setHeader('Content-Type', XLSX_MIME);
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="recepciones.xlsx"'
    );
    await this.exportService.streamRecepcionesToExcel(query, res);
  }

  /**
   * Exports the recetas dataset as an XLSX file download.
   * @param {ExportRecetaFilterDto} query - Optional filter criteria for the export.
   * @param {Response} res - Express response used to stream the file.
   * @returns {Promise<void>}
   */
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

  /**
   * Exports the ubicaciones dataset as an XLSX file download.
   * @param {ExportUbicacionFilterDto} query - Optional filter criteria for the export.
   * @param {Response} res - Express response used to stream the file.
   * @returns {Promise<void>}
   */
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

  /**
   * Exports the usuarios dataset as an XLSX file download.
   * @param {ExportUsuarioFilterDto} query - Optional filter criteria for the export.
   * @param {Response} res - Express response used to stream the file.
   * @returns {Promise<void>}
   */
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

  /**
   * Exports the productos dataset as a PDF file download.
   * @param {ExportProductoFilterDto} query - Optional filter criteria for the export.
   * @param {Response} res - Express response used to stream the file.
   * @returns {Promise<void>}
   */
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

  /**
   * Exports the proveedores dataset as a PDF file download.
   * @param {ExportProveedorFilterDto} query - Optional filter criteria for the export.
   * @param {Response} res - Express response used to stream the file.
   * @returns {Promise<void>}
   */
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

  /**
   * Exports the inventario dataset as a PDF file download.
   * @param {ExportInventarioFilterDto} query - Optional filter criteria for the export.
   * @param {Response} res - Express response used to stream the file.
   * @returns {Promise<void>}
   */
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

  /**
   * Exports the pedidos dataset as a PDF file download.
   * @param {ExportPedidoFilterDto} query - Optional filter criteria for the export.
   * @param {Response} res - Express response used to stream the file.
   * @returns {Promise<void>}
   */
  @Get('pedidos/pdf')
  @RequirePermissions(PERMISSIONS.pedidos.listar)
  async exportPedidosPdf(
    @Query() query: ExportPedidoFilterDto,
    @Res() res: Response
  ): Promise<void> {
    res.setHeader('Content-Type', PDF_MIME);
    res.setHeader('Content-Disposition', 'attachment; filename="pedidos.pdf"');
    await this.exportService.streamPedidosToPdf(query, res);
  }

  /**
   * Exports the albaranes dataset as a PDF file download.
   * @param {ExportAlbaranFilterDto} query - Optional filter criteria for the export.
   * @param {Response} res - Express response used to stream the file.
   * @returns {Promise<void>}
   */
  @Get('albaranes/pdf')
  @RequirePermissions(PERMISSIONS.albaranes.listar)
  async exportAlbaranesPdf(
    @Query() query: ExportAlbaranFilterDto,
    @Res() res: Response
  ): Promise<void> {
    res.setHeader('Content-Type', PDF_MIME);
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="albaranes.pdf"'
    );
    await this.exportService.streamAlbaranesToPdf(query, res);
  }

  /**
   * Exports the incidencias dataset as a PDF file download.
   * @param {ExportIncidenciaFilterDto} query - Optional filter criteria for the export.
   * @param {Response} res - Express response used to stream the file.
   * @returns {Promise<void>}
   */
  @Get('incidencias/pdf')
  @RequirePermissions(PERMISSIONS.incidencias.listar)
  async exportIncidenciasPdf(
    @Query() query: ExportIncidenciaFilterDto,
    @Res() res: Response
  ): Promise<void> {
    res.setHeader('Content-Type', PDF_MIME);
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="incidencias.pdf"'
    );
    await this.exportService.streamIncidenciasToPdf(query, res);
  }

  /**
   * Exports the recetas dataset as a PDF file download.
   * @param {ExportRecetaFilterDto} query - Optional filter criteria for the export.
   * @param {Response} res - Express response used to stream the file.
   * @returns {Promise<void>}
   */
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

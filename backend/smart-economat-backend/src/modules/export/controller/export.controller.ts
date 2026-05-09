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
 * Controlador REST para export.
 */
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('export')
export class ExportController {
  /**
   * Construye la instancia configurada.
   * @undefined {ExportService} exportService - Entrada efectiva esperada por el contrato.
   */
  constructor(private readonly exportService: ExportService) {}

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "exportProductos" en smart-economat-backend (Nest).
   * @undefined {ExportProductoFilterDto} query - Entrada efectiva esperada por el contrato.
   * @undefined {Response<any, Record<string, any>>} res - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
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
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "exportPedidos" en smart-economat-backend (Nest).
   * @undefined {ExportPedidoFilterDto} query - Entrada efectiva esperada por el contrato.
   * @undefined {Response<any, Record<string, any>>} res - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
   */
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

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "exportProveedores" en smart-economat-backend (Nest).
   * @undefined {ExportProveedorFilterDto} query - Entrada efectiva esperada por el contrato.
   * @undefined {Response<any, Record<string, any>>} res - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
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
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "exportAlbaranes" en smart-economat-backend (Nest).
   * @undefined {ExportAlbaranFilterDto} query - Entrada efectiva esperada por el contrato.
   * @undefined {Response<any, Record<string, any>>} res - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
   */
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

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "exportIncidencias" en smart-economat-backend (Nest).
   * @undefined {ExportIncidenciaFilterDto} query - Entrada efectiva esperada por el contrato.
   * @undefined {Response<any, Record<string, any>>} res - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
   */
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

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "exportInventario" en smart-economat-backend (Nest).
   * @undefined {ExportInventarioFilterDto} query - Entrada efectiva esperada por el contrato.
   * @undefined {Response<any, Record<string, any>>} res - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
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
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "exportMovimientos" en smart-economat-backend (Nest).
   * @undefined {ExportMovimientoFilterDto} query - Entrada efectiva esperada por el contrato.
   * @undefined {Response<any, Record<string, any>>} res - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
   */
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

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "exportRecepciones" en smart-economat-backend (Nest).
   * @undefined {ExportRecepcionFilterDto} query - Entrada efectiva esperada por el contrato.
   * @undefined {Response<any, Record<string, any>>} res - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
   */
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

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "exportRecetas" en smart-economat-backend (Nest).
   * @undefined {ExportRecetaFilterDto} query - Entrada efectiva esperada por el contrato.
   * @undefined {Response<any, Record<string, any>>} res - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
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
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "exportUbicaciones" en smart-economat-backend (Nest).
   * @undefined {ExportUbicacionFilterDto} query - Entrada efectiva esperada por el contrato.
   * @undefined {Response<any, Record<string, any>>} res - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
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
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "exportUsuarios" en smart-economat-backend (Nest).
   * @undefined {ExportUsuarioFilterDto} query - Entrada efectiva esperada por el contrato.
   * @undefined {Response<any, Record<string, any>>} res - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
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
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "exportProductosPdf" en smart-economat-backend (Nest).
   * @undefined {ExportProductoFilterDto} query - Entrada efectiva esperada por el contrato.
   * @undefined {Response<any, Record<string, any>>} res - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
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
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "exportProveedoresPdf" en smart-economat-backend (Nest).
   * @undefined {ExportProveedorFilterDto} query - Entrada efectiva esperada por el contrato.
   * @undefined {Response<any, Record<string, any>>} res - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
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
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "exportInventarioPdf" en smart-economat-backend (Nest).
   * @undefined {ExportInventarioFilterDto} query - Entrada efectiva esperada por el contrato.
   * @undefined {Response<any, Record<string, any>>} res - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
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
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "exportPedidosPdf" en smart-economat-backend (Nest).
   * @undefined {ExportPedidoFilterDto} query - Entrada efectiva esperada por el contrato.
   * @undefined {Response<any, Record<string, any>>} res - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
   */
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

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "exportAlbaranesPdf" en smart-economat-backend (Nest).
   * @undefined {ExportAlbaranFilterDto} query - Entrada efectiva esperada por el contrato.
   * @undefined {Response<any, Record<string, any>>} res - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
   */
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

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "exportIncidenciasPdf" en smart-economat-backend (Nest).
   * @undefined {ExportIncidenciaFilterDto} query - Entrada efectiva esperada por el contrato.
   * @undefined {Response<any, Record<string, any>>} res - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
   */
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

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "exportRecetasPdf" en smart-economat-backend (Nest).
   * @undefined {ExportRecetaFilterDto} query - Entrada efectiva esperada por el contrato.
   * @undefined {Response<any, Record<string, any>>} res - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
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

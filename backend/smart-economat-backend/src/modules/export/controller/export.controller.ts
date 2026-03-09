import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/role.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { rolUsuario } from '../../usuario/enums/usuario.enums';
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

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('productos/xlsx')
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
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
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
  async exportPedidos(
    @Query() query: ExportPedidoFilterDto,
    @Res() res: Response
  ): Promise<void> {
    res.setHeader('Content-Type', XLSX_MIME);
    res.setHeader('Content-Disposition', 'attachment; filename="pedidos.xlsx"');
    await this.exportService.streamPedidosToExcel(query, res);
  }

  @Get('proveedores/xlsx')
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
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
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
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

  @Get('incidencias/xlsx')
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
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

  @Get('inventario/xlsx')
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
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
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
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

  @Get('recepciones/xlsx')
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
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

  @Get('recetas/xlsx')
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
  async exportRecetas(
    @Query() query: ExportRecetaFilterDto,
    @Res() res: Response
  ): Promise<void> {
    res.setHeader('Content-Type', XLSX_MIME);
    res.setHeader('Content-Disposition', 'attachment; filename="recetas.xlsx"');
    await this.exportService.streamRecetasToExcel(query, res);
  }

  @Get('ubicaciones/xlsx')
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
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
  @Roles(rolUsuario.ADMINISTRADOR)
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
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
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
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
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
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
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
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
  async exportPedidosPdf(
    @Query() query: ExportPedidoFilterDto,
    @Res() res: Response
  ): Promise<void> {
    res.setHeader('Content-Type', PDF_MIME);
    res.setHeader('Content-Disposition', 'attachment; filename="pedidos.pdf"');
    await this.exportService.streamPedidosToPdf(query, res);
  }

  @Get('albaranes/pdf')
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
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

  @Get('recetas/pdf')
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
  async exportRecetasPdf(
    @Query() query: ExportRecetaFilterDto,
    @Res() res: Response
  ): Promise<void> {
    res.setHeader('Content-Type', PDF_MIME);
    res.setHeader('Content-Disposition', 'attachment; filename="recetas.pdf"');
    await this.exportService.streamRecetasToPdf(query, res);
  }
}

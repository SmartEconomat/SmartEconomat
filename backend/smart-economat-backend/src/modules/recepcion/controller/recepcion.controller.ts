import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ParseUUIDv7Pipe } from '../../../common/pipes';
import { CreateRecepcionDto } from '../dto/create-recepcion.dto';
import { UpdateRecepcionDto } from '../dto/update-recepcion.dto';
import { SortableFields } from '../../../common/decorators/sortable-fields.decorator';
import { Recepcion } from '../recepcion.entity/recepcion.entity';
import { RecepcionService } from '../service/recepcion.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermisosGuard } from '../../auth/guards/auth-permissions.guard';
import { RecepcionStockService } from '../service/recepcion-stock.service';
import { RecepcionResultadoDto } from '../dto/recepcion-resultado.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { PdfReportService } from '../service/pdf-report.service';
import { RecepcionReportePdfDto } from '../dto/recepcion-reporte-pdf.dto';
import { PERMISSIONS } from '../../../common/constants/permissions.constants';
import { validateDateRange } from '../../../common/utils/date-range.util';
import { SORTABLE_FIELDS } from '../../../common/constants/sortable-fields.constants';

/**
 * Controlador para la gestión de recepciones de mercancía.
 * Permite registrar la entrada física de productos vinculados a pedidos,
 * generar reportes en PDF y gestionar incidencias de recepción.
 */
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('recepciones')
export class RecepcionController {
  private withRecepcionLabels<T extends { estado?: string | null }>(
    recepcion: T
  ): T & { estadoLabelKey?: string } {
    if (!recepcion?.estado) {
      return recepcion;
    }

    return {
      ...recepcion,
      estadoLabelKey: `enum.recepcionEstado.${String(recepcion.estado).toUpperCase()}`,
    };
  }
  /**
   * Crea una instancia de RecepcionController.
   * @param recepcionService Servicio base de recepciones.
   * @param recepcionStockService Servicio especializado para el procesamiento de stock e incidencias.
   * @param pdfReportService Servicio para la generación de reportes PDF.
   */
  constructor(
    private readonly recepcionService: RecepcionService,
    private readonly recepcionStockService: RecepcionStockService,
    private readonly pdfReportService: PdfReportService
  ) {}

  /**
   * Procesa una nueva recepción de mercancía, actualizando el stock y cerrando pedidos.
   * @param dto Datos de la recepción (pedido, productos recibidos, estados).
   * @param req Petición para obtener el usuario receptor.
   * @returns Resultado del procesamiento de la recepción.
   */
  @Post()
  @RequirePermissions(PERMISSIONS.recepciones.crear)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateRecepcionDto,
    @Req() req: { user: { id: string } }
  ): Promise<RecepcionResultadoDto> {
    dto.usuarioId = req.user.id;
    return this.recepcionStockService.procesarRecepcion(dto);
  }

  /**
   * Lista las recepciones con soporte para paginación y ordenación.
   * @param query Parámetros de consulta.
   * @param req Petición para contexto de usuario.
   * @returns Lista paginada de recepciones.
   */
  @Get()
  @RequirePermissions(PERMISSIONS.recepciones.listar)
  findAll(
    @SortableFields(SORTABLE_FIELDS.recepciones)
    query: PaginationQueryDto,
    @Req() req: { user?: { rol?: string } }
  ): Promise<PaginatedResponseDto<Recepcion>> {
    const userRole = req.user?.rol;
    return this.recepcionService.findAll(query, userRole).then((result) => ({
      ...result,
      data: result.data.map((recepcion) => this.withRecepcionLabels(recepcion)),
    }));
  }

  /**
   * Genera y descarga un reporte PDF de las recepciones filtradas.
   * @param filters Filtros de fecha y proveedor para el reporte.
   * @param res Respuesta Express para el streaming del PDF.
   */
  /**
   * Expone "reportePdf" en smart-economat-backend (Nest).
   * @undefined {RecepcionReportePdfDto} filters - Entrada efectiva esperada por el contrato.
   * @undefined {Response<any, Record<string, any>>} res - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
   */
  @Get('reporte-pdf')
  @RequirePermissions(PERMISSIONS.recepciones.listar)
  async reportePdf(
    @Query() filters: RecepcionReportePdfDto,
    @Res() res: Response
  ): Promise<void> {
    validateDateRange(
      filters.startDate,
      filters.endDate,
      365,
      'Reporte de Recepciones'
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="reporte-recepcion.pdf"'
    );
    await this.pdfReportService.generateReport(filters, res);
  }

  /**
   * Obtiene el detalle de una recepción por su ID.
   * @param id UUID de la recepción.
   * @param req Petición para contexto de usuario.
   * @returns La recepción encontrada.
   */
  @Get(':id')
  @RequirePermissions(PERMISSIONS.recepciones.ver)
  findOne(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Req() req: { user?: { rol?: string } }
  ): Promise<Recepcion> {
    const userRole = req.user?.rol;
    return this.recepcionService
      .findOne(id, userRole)
      .then((recepcion) => this.withRecepcionLabels(recepcion));
  }

  /**
   * Actualiza los datos de una recepción.
   * @param id UUID de la recepción.
   * @param dto Datos a actualizar.
   * @param req Petición para auditoría.
   * @returns La recepción actualizada.
   */
  @Patch(':id')
  @RequirePermissions(PERMISSIONS.recepciones.editar)
  update(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Body() dto: UpdateRecepcionDto,
    @Req() req: { user: { id: string } }
  ): Promise<Recepcion> {
    return this.recepcionService
      .update(id, dto, req.user.id)
      .then((recepcion) => this.withRecepcionLabels(recepcion));
  }

  /**
   * Elimina una recepción (eliminación lógica).
   * @param id UUID de la recepción.
   */
  /**
   * Expone "remove" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {{ user: { id: string; }; }} req - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
   */
  @Delete(':id')
  @RequirePermissions(PERMISSIONS.recepciones.eliminar)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Req() req: { user: { id: string } }
  ): Promise<void> {
    return this.recepcionService.remove(id, req.user.id);
  }
}

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

/**
 * REST controller that exposes endpoints for managing goods receipts (Recepcion),
 * including stock processing, paginated listing, PDF report generation, and CRUD operations.
 *
 * @class RecepcionController
 */
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('recepciones')
export class RecepcionController {
  /**
   * Creates an instance of RecepcionController.
   *
   * @param {RecepcionService} recepcionService - Service for receipt CRUD operations.
   * @param {RecepcionStockService} recepcionStockService - Service that processes stock updates on receipt.
   * @param {PdfReportService} pdfReportService - Service for generating PDF receipt reports.
   */
  constructor(
    private readonly recepcionService: RecepcionService,
    private readonly recepcionStockService: RecepcionStockService,
    private readonly pdfReportService: PdfReportService
  ) {}

  /**
   * Processes a new goods receipt, updating inventory stock accordingly.
   * If no user is specified in the payload, the authenticated user is used.
   *
   * @param {CreateRecepcionDto} dto - Receipt creation payload.
   * @param {{ user: { id: string } }} req - Authenticated request object.
   * @returns {Promise<RecepcionResultadoDto>} Result object summarising the processed receipt.
   */
  @Post()
  @RequirePermissions(PERMISSIONS.recepciones.crear)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateRecepcionDto,
    @Req() req: { user: { id: string } }
  ): Promise<RecepcionResultadoDto> {
    const userId = req.user.id;
    dto.usuarioId = dto.usuarioId || userId;
    return this.recepcionStockService.procesarRecepcion(dto);
  }

  /**
   * Returns a paginated list of goods receipts. Admin users also receive
   * soft-deleted records.
   *
   * @param {PaginationQueryDto} query - Pagination and sort parameters.
   * @param {{ user?: { rol?: string } }} req - Authenticated request object.
   * @returns {Promise<PaginatedResponseDto<Recepcion>>} Paginated receipt list.
   */
  @Get()
  @RequirePermissions(PERMISSIONS.recepciones.listar)
  findAll(
    @SortableFields(['fechaRecepcion', 'estado', 'createdAt', 'updatedAt'])
    query: PaginationQueryDto,
    @Req() req: { user?: { rol?: string } }
  ): Promise<PaginatedResponseDto<Recepcion>> {
    const userRole = req.user?.rol;
    return this.recepcionService.findAll(query, userRole);
  }

  /**
   * Generates and streams a PDF report of receipts matching the provided filters.
   * The response is sent with appropriate PDF headers for file download.
   *
   * @param {RecepcionReportePdfDto} filters - Date-range and other filter parameters for the report.
   * @param {Response} res - Express response object used for streaming the PDF.
   * @returns {Promise<void>}
   */
  @Get('reporte-pdf')
  @RequirePermissions(PERMISSIONS.recepciones.listar)
  async reportePdf(
    @Query() filters: RecepcionReportePdfDto,
    @Res() res: Response
  ): Promise<void> {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="reporte-recepcion.pdf"'
    );
    await this.pdfReportService.generateReport(filters, res);
  }

  /**
   * Retrieves a single goods receipt by UUID with full relation data.
   *
   * @param {string} id - UUID v7 of the receipt.
   * @param {{ user?: { rol?: string } }} req - Authenticated request object.
   * @returns {Promise<Recepcion>} The found receipt entity.
   */
  @Get(':id')
  @RequirePermissions(PERMISSIONS.recepciones.ver)
  findOne(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Req() req: { user?: { rol?: string } }
  ): Promise<Recepcion> {
    const userRole = req.user?.rol;
    return this.recepcionService.findOne(id, userRole);
  }

  /**
   * Partially updates a goods receipt's editable fields.
   *
   * @param {string} id - UUID v7 of the receipt to update.
   * @param {UpdateRecepcionDto} dto - Fields to update.
   * @param {{ user: { id: string } }} req - Authenticated request object.
   * @returns {Promise<Recepcion>} The updated receipt entity.
   */
  @Patch(':id')
  @RequirePermissions(PERMISSIONS.recepciones.editar)
  update(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Body() dto: UpdateRecepcionDto,
    @Req() req: { user: { id: string } }
  ): Promise<Recepcion> {
    return this.recepcionService.update(id, dto, req.user.id);
  }

  /**
   * Soft-deletes a goods receipt. Returns HTTP 204 No Content on success.
   *
   * @param {string} id - UUID v7 of the receipt to delete.
   * @returns {Promise<void>}
   */
  @Delete(':id')
  @RequirePermissions(PERMISSIONS.recepciones.eliminar)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDv7Pipe) id: string): Promise<void> {
    return this.recepcionService.remove(id);
  }
}

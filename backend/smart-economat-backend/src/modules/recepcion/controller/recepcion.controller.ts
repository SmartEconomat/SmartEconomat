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
 * Documentación en español.
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
   * Documentación en español.
   */
  constructor(
    private readonly recepcionService: RecepcionService,
    private readonly recepcionStockService: RecepcionStockService,
    private readonly pdfReportService: PdfReportService
  ) {}

  /**
   * Documentación en español.
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
   * Documentación en español.
   */
  @Get()
  @RequirePermissions(PERMISSIONS.recepciones.listar)
  findAll(
    @SortableFields(['fechaRecepcion', 'estado', 'createdAt', 'updatedAt'])
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
   * Documentación en español.
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
   * Documentación en español.
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
   * Documentación en español.
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
   * Documentación en español.
   */
  @Delete(':id')
  @RequirePermissions(PERMISSIONS.recepciones.eliminar)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDv7Pipe) id: string): Promise<void> {
    return this.recepcionService.remove(id);
  }
}

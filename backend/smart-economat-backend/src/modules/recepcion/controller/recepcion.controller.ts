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
  Request,
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
import { RecepcionStockService } from '../service/recepcion-stock.service';
import { RecepcionResultadoDto } from '../dto/recepcion-resultado.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { PermisosGuard } from '../../auth/guards/auth-permissions.guard';
import { PdfReportService } from '../service/pdf-report.service';
import { RecepcionReportePdfDto } from '../dto/recepcion-reporte-pdf.dto';

@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('recepcion')
export class RecepcionController {
  constructor(
    private readonly recepcionService: RecepcionService,
    private readonly recepcionStockService: RecepcionStockService,
    private readonly pdfReportService: PdfReportService
  ) {}

  @Post()
  @RequirePermissions('recepciones:crear')
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateRecepcionDto,
    @Request() req: any
  ): Promise<RecepcionResultadoDto> {
    const userId = req.user.id;
    dto.usuarioId = dto.usuarioId || userId;
    return this.recepcionStockService.procesarRecepcion(dto);
  }

  @Get()
  @RequirePermissions('recepciones:listar')
  findAll(
    @SortableFields(['fechaRecepcion', 'estado', 'createdAt', 'updatedAt'])
    query: PaginationQueryDto
  ): Promise<PaginatedResponseDto<Recepcion>> {
    return this.recepcionService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('recepciones:ver')
  findOne(@Param('id', ParseUUIDv7Pipe) id: string): Promise<Recepcion> {
    return this.recepcionService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('recepciones:editar')
  update(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Body() dto: UpdateRecepcionDto
  ): Promise<Recepcion> {
    return this.recepcionService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('recepciones:eliminar')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDv7Pipe) id: string): Promise<void> {
    return this.recepcionService.remove(id);
  }

  @Get('reporte-pdf')
  @RequirePermissions('recepciones:listar')
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
}

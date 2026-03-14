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
import { RolesGuard } from '../../auth/guards/role.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { rolUsuario } from '../../usuario/enums/usuario.enums';
import { RecepcionStockService } from '../service/recepcion-stock.service';
import { RecepcionResultadoDto } from '../dto/recepcion-resultado.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { PermisosGuard } from '../../auth/guards/auth-permissions.guard';
import { PdfReportService } from '../service/pdf-report.service';
import { RecepcionReportePdfDto } from '../dto/recepcion-reporte-pdf.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('recepcion')
export class RecepcionController {
  constructor(
    private readonly recepcionService: RecepcionService,
    private readonly recepcionStockService: RecepcionStockService,
    private readonly pdfReportService: PdfReportService
  ) {}

  @Post()
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
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

  @Get(':id')
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Recepcion> {
    return this.recepcionService.findOne(id);
  }

  @Patch(':id')
  @Roles(rolUsuario.ADMINISTRADOR, rolUsuario.PROFESOR)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRecepcionDto
  ): Promise<Recepcion> {
    return this.recepcionService.update(id, dto);
  }

  @Delete(':id')
  @Roles(rolUsuario.ADMINISTRADOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
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

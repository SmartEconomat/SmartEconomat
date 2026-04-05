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
  Res,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import type { Response as ExpressResponse } from 'express';
import { I18nHelper } from '../../../common/helpers/i18n.helper';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { ParseUUIDv7Pipe } from '../../../common/pipes';
import { CreateAlbaranDto } from '../dto/create-albaran.dto';
import { UpdateAlbaranDto } from '../dto/update-albaran.dto';
import { UploadAlbaranDto } from '../dto/upload-albaran.dto';
import { Albaran } from '../albaran.entity/albaran.entity';
import { AlbaranService } from '../service/albaran.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { SortableFields } from '../../../common/decorators/sortable-fields.decorator';
import { PermisosGuard } from '../../auth/guards/auth-permissions.guard';
import { PERMISSIONS } from '../../../common/constants/permissions.constants';

@ApiTags('Albaranes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('albaranes')
export class AlbaranController {
  constructor(private readonly albaranService: AlbaranService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.albaranes.crear)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateAlbaranDto): Promise<Albaran> {
    return this.albaranService.create(dto);
  }

  /**
   * Sube un documento (foto o PDF) asociado a un albarán.
   *
   * - El archivo se envía como `multipart/form-data` en el campo `file`.
   * - `numeroReferencia` es obligatorio y se envía como campo de texto.
   * - `recepcionId` es opcional; si se incluye, se vincula el albarán a la recepción.
   *
   * Tipos soportados: image/jpeg, image/png, image/gif, application/pdf.
   * Tamaño máximo: configurado en MAX_FILE_SIZE_MB (por defecto 10 MB).
   */
  @Post('upload-documento')
  @RequirePermissions(PERMISSIONS.albaranes.crear)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Subir documento de albarán',
    description:
      'Sube un archivo (foto o PDF) del albarán físico y lo vincula a una recepción.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'numeroReferencia'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Archivo del albarán (imagen o PDF)',
        },
        numeroReferencia: {
          type: 'string',
          description: 'Número de referencia del albarán',
          example: 'ALB-2026-0042',
        },
        recepcionId: {
          type: 'string',
          format: 'uuid',
          description: 'ID de la recepción a vincular (opcional)',
        },
        observaciones: {
          type: 'string',
          description: 'Observaciones sobre el documento (opcional)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Documento subido y vinculado correctamente',
  })
  @ApiResponse({
    status: 400,
    description:
      'Datos inválidos, archivo no proporcionado o tipo no soportado',
  })
  @ApiResponse({
    status: 404,
    description: 'Recepción no encontrada',
  })
  @ApiResponse({
    status: 409,
    description: 'El albarán ya tiene un documento adjunto',
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocumento(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadAlbaranDto
  ): Promise<{ message: string; data: Albaran }> {
    const albaran = await this.albaranService.uploadDocumento(file, dto);
    return {
      message: I18nHelper.getSuccess('DELIVERY_NOTE_UPLOADED'),
      data: albaran,
    };
  }

  /**
   * Obtiene el archivo físico del albarán.
   * Requiere permiso PERMISSIONS.albaranes.ver en lugar del general PERMISSIONS.archivos.ver.
   */
  @Get('documento/:filename')
  @RequirePermissions(PERMISSIONS.albaranes.ver)
  @ApiOperation({
    summary: 'Obtener documento de albarán',
    description: 'Sirve el archivo físico del albarán (imagen o PDF).',
  })
  serveDocumento(
    @Param('filename') filename: string,
    @Res() res: ExpressResponse
  ) {
    const filePath = this.albaranService.getDocumentoPath(filename);
    return res.sendFile(filePath);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.albaranes.listar)
  findAll(
    @SortableFields([
      'nAlbaran',
      'concordancia',
      'fecha',
      'createdAt',
      'updatedAt',
    ])
    query: PaginationQueryDto,
    @Req() req: { user?: { rol?: string } }
  ): Promise<PaginatedResponseDto<Albaran>> {
    const userRole = req.user?.rol;
    return this.albaranService.findAll(query, userRole);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.albaranes.ver)
  findOne(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Req() req: { user?: { rol?: string } }
  ): Promise<Albaran> {
    const userRole = req.user?.rol;
    return this.albaranService.findOne(id, userRole, true);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.albaranes.editar)
  update(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Body() dto: UpdateAlbaranDto
  ): Promise<Albaran> {
    return this.albaranService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.albaranes.eliminar)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDv7Pipe) id: string): Promise<void> {
    return this.albaranService.remove(id);
  }
}

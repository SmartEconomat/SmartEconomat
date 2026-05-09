/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
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
import { SORTABLE_FIELDS } from '../../../common/constants/sortable-fields.constants';

/**
 * Controlador REST para albaran.
 */
@ApiTags('Albaranes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('albaranes')
export class AlbaranController {
  /**
   * Inicializa la instancia con los colaboradores necesarios para el flujo.
   *
   * @param private readonly albaranService Parámetro de entrada para la operación.
   */
  constructor(private readonly albaranService: AlbaranService) {}

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Crea recursos nuevos en base a las reglas de negocio.
   * @undefined {CreateAlbaranDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<Albaran>} Datos efectivos después de ejecutar la operación.
   */
  @Post()
  @RequirePermissions(PERMISSIONS.albaranes.crear)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateAlbaranDto): Promise<Albaran> {
    return this.albaranService.create(dto);
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "uploadDocumento" en smart-economat-backend (Nest).
   * @undefined {Express.Multer.File} file - Entrada efectiva esperada por el contrato.
   * @undefined {UploadAlbaranDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<{ message: string; data: Albaran; }>} Datos efectivos después de ejecutar la operación.
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
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "serveDocumento" en smart-economat-backend (Nest).
   * @undefined {string} filename - Entrada efectiva esperada por el contrato.
   * @undefined {ExpressResponse<any, Record<string, any>>} res - Entrada efectiva esperada por el contrato.
   * @undefined {void} Datos efectivos después de ejecutar la operación.
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

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "findAll" en smart-economat-backend (Nest).
   * @undefined {PaginationQueryDto} query - Entrada efectiva esperada por el contrato.
   * @undefined {{ user?: { rol?: string; }; }} req - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<PaginatedResponseDto<Albaran>>} Datos efectivos después de ejecutar la operación.
   */
  @Get()
  @RequirePermissions(PERMISSIONS.albaranes.listar)
  findAll(
    @SortableFields(SORTABLE_FIELDS.albaranes)
    query: PaginationQueryDto,
    @Req() req: { user?: { rol?: string } }
  ): Promise<PaginatedResponseDto<Albaran>> {
    const userRole = req.user?.rol;
    return this.albaranService.findAll(query, userRole);
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "findOne" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {{ user?: { rol?: string; }; }} req - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<Albaran>} Datos efectivos después de ejecutar la operación.
   */
  @Get(':id')
  @RequirePermissions(PERMISSIONS.albaranes.ver)
  findOne(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Req() req: { user?: { rol?: string } }
  ): Promise<Albaran> {
    const userRole = req.user?.rol;
    return this.albaranService.findOne(id, userRole, true);
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Persiste modificaciones válidas sobre entidades existentes.
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {UpdateAlbaranDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<Albaran>} Datos efectivos después de ejecutar la operación.
   */
  @Patch(':id')
  @RequirePermissions(PERMISSIONS.albaranes.editar)
  update(
    @Param('id', ParseUUIDv7Pipe) id: string,
    @Body() dto: UpdateAlbaranDto
  ): Promise<Albaran> {
    return this.albaranService.update(id, dto);
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "remove" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
   */
  @Delete(':id')
  @RequirePermissions(PERMISSIONS.albaranes.eliminar)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDv7Pipe) id: string): Promise<void> {
    return this.albaranService.remove(id);
  }
}

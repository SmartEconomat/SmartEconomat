/**
 * @module AlbaranController
 * REST controller for the /albaranes resource. Exposes endpoints to create,
 * list, retrieve, update, soft-delete albaranes and to upload/serve their
 * associated document files.
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

/**
 * Controller that handles HTTP requests for delivery notes (albaranes).
 * All routes are protected by JWT authentication and role-based permissions.
 * @class AlbaranController
 */
@ApiTags('Albaranes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('albaranes')
export class AlbaranController {
  /**
   * Constructs the AlbaranController with its required service dependency.
   * @param {AlbaranService} albaranService - The service that handles albaran business logic.
   */
  constructor(private readonly albaranService: AlbaranService) {}

  /**
   * Creates a new albaran from the request body.
   * @param {CreateAlbaranDto} dto - Payload containing the fields for the new albaran.
   * @returns {Promise<Albaran>} The newly created Albaran entity.
   */
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
   * @param {Express.Multer.File} file - The uploaded file provided by Multer.
   * @param {UploadAlbaranDto} dto - Form data containing the reference number, optional recepcionId and observations.
   * @returns {Promise<{ message: string; data: Albaran }>} Success message and the updated Albaran.
   * @throws {BadRequestException} If no file is provided or the type/size is invalid.
   * @throws {NotFoundException} If the specified recepcionId does not exist.
   * @throws {ConflictException} If the albaran already has a document attached.
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
   * @param {string} filename - The filename (not path) of the stored document.
   * @param {ExpressResponse} res - Express response object used to stream the file.
   * @returns The file stream sent directly via `res.sendFile`.
   * @throws {BadRequestException} If the filename contains a path traversal sequence.
   * @throws {NotFoundException} If the file does not exist on disk.
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
   * Returns a paginated, sorted list of albaranes.
   * Admin and super-admin users also receive soft-deleted records.
   * @param {PaginationQueryDto} query - Pagination and sorting parameters.
   * @param {{ user?: { rol?: string } }} req - Express request object used to extract the user role.
   * @returns {Promise<PaginatedResponseDto<Albaran>>} Paginated list of albaranes.
   */
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

  /**
   * Retrieves a single albaran by its UUID, including full product detail relations.
   * @param {string} id - UUIDv7 of the albaran to retrieve.
   * @param {{ user?: { rol?: string } }} req - Express request object used to extract the user role.
   * @returns {Promise<Albaran>} The found Albaran entity with all detail relations loaded.
   * @throws {NotFoundException} If no albaran with the given ID exists.
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
   * Partially updates an albaran identified by its UUID.
   * @param {string} id - UUIDv7 of the albaran to update.
   * @param {UpdateAlbaranDto} dto - Partial payload with the fields to update.
   * @returns {Promise<Albaran>} The updated Albaran entity.
   * @throws {NotFoundException} If no albaran with the given ID exists.
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
   * Soft-deletes an albaran identified by its UUID. Returns HTTP 204 No Content on success.
   * @param {string} id - UUIDv7 of the albaran to remove.
   * @returns {Promise<void>}
   * @throws {NotFoundException} If no albaran with the given ID exists.
   */
  @Delete(':id')
  @RequirePermissions(PERMISSIONS.albaranes.eliminar)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDv7Pipe) id: string): Promise<void> {
    return this.albaranService.remove(id);
  }
}

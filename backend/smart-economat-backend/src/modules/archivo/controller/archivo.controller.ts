import {
  Controller,
  Get,
  Post,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  Query,
  UseGuards,
  Req,
  Res,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileResponseDto } from '../dto/file-response.dto';
import { ArchivoService } from '../service/archivo.service';
import { FileListFilterDto } from '../dto/file-list-filter.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { I18nHelper } from '../../../common/helpers/i18n.helper';
import type { Response } from 'express';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { PermisosGuard } from '../../auth/guards/auth-permissions.guard';
import { Public } from '../../../common/decorators/public.decorator';
import { PERMISSIONS } from '../../../common/constants/permissions.constants';

/**
 * Controller that exposes endpoints for file upload, listing, metadata retrieval,
 * content serving and deletion. File content serving is public; all other routes
 * require JWT authentication and appropriate file permissions.
 *
 * @class ArchivoController
 */
@ApiTags('Archivos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('archivos')
export class ArchivoController {
  constructor(private readonly archivoService: ArchivoService) {}

  /**
   * Uploads a file for the authenticated user. Images are automatically optimised to WebP.
   *
   * @param {Express.Multer.File} file - Uploaded file from multipart/form-data.
   * @param {{ user: Usuario }} req - Express request with authenticated user.
   * @returns {Promise<{ message: string; data: FileResponseDto }>} Upload confirmation with file metadata.
   * @throws {BadRequestException} When no file is provided in the request.
   */
  @Post('upload')
  @RequirePermissions(PERMISSIONS.archivos.subir)
  @ApiOperation({ summary: 'Subir un nuevo archivo' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'docs.ARCHIVO_SUBIDO_CORRECTAMENTE',
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: { user: Usuario }
  ): Promise<any> {
    const user = req.user;
    const result = await this.archivoService.uploadFile(file, user);
    return {
      message: I18nHelper.getSuccess('FILE_UPLOADED'),
      data: this.mapToResponseDto(result),
    };
  }

  /**
   * Returns a paginated list of active files, optionally filtered by user ID or MIME type.
   *
   * @param {FileListFilterDto} filterDto - Pagination and filter parameters.
   * @returns {Promise<{ data: FileResponseDto[]; total: number; page: number; limit: number; totalPages: number }>}
   *   Paginated file list with metadata.
   */
  @Get()
  @RequirePermissions(PERMISSIONS.archivos.listar)
  @ApiOperation({ summary: 'Listar archivos' })
  @ApiResponse({ status: 200, description: 'docs.LISTA_DE_ARCHIVOS_PAGINADA' })
  async findAll(@Query() filterDto: FileListFilterDto) {
    const result = await this.archivoService.findAll(filterDto);
    return {
      data: result.data.map((a) => this.mapToResponseDto(a)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  /**
   * Returns the metadata for a single file by its UUID.
   *
   * @param {string} id - UUID of the Archivo to retrieve.
   * @returns {Promise<FileResponseDto>} File metadata DTO.
   * @throws {NotFoundException} When no active file with the given ID exists.
   */
  @Get(':id')
  @RequirePermissions(PERMISSIONS.archivos.ver)
  @ApiOperation({ summary: 'Obtener metadata de un archivo por ID' })
  @ApiResponse({ status: 200, description: 'docs.DETALLES_DEL_ARCHIVO' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<FileResponseDto> {
    const result = await this.archivoService.findOne(id);
    return this.mapToResponseDto(result);
  }

  /**
   * Serves the binary content of an uploaded file directly from the local storage directory.
   * This endpoint is publicly accessible — no authentication required.
   *
   * @param {string} filename - Filename (without directory components) to serve.
   * @param {Response} res - Express response used to send the file binary.
   * @throws {BadRequestException} When the filename resolves outside the upload directory.
   * @throws {NotFoundException} When the file does not exist on disk.
   */
  @Get('content/:filename')
  @Public()
  @ApiOperation({ summary: 'Servir el contenido de un archivo subido' })
  getFileContent(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = this.archivoService.getFileContent(filename);
    res.sendFile(filePath);
  }

  /**
   * Soft-deletes a file record and removes its physical file(s) from disk.
   * Only the uploader or elevated-role users may perform this operation.
   * Returns HTTP 204 No Content on success.
   *
   * @param {string} id - UUID of the Archivo to remove.
   * @param {{ user: Usuario }} req - Express request with authenticated user.
   * @param {Response} res - Express response used to send the 204 status.
   * @returns {Promise<void>}
   * @throws {NotFoundException} When no active file with the given ID exists.
   * @throws {ForbiddenException} When the requesting user is not the uploader and lacks an elevated role.
   */
  @Delete(':id')
  @RequirePermissions(PERMISSIONS.archivos.eliminar)
  @ApiOperation({ summary: 'Eliminar un archivo (soft-delete)' })
  @ApiResponse({
    status: 204,
    description: 'docs.ARCHIVO_ELIMINADO_CORRECTAMENTE',
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: { user: Usuario },
    @Res() res: Response
  ) {
    const user = req.user;
    await this.archivoService.remove(id, user);
    res.status(HttpStatus.NO_CONTENT).send();
  }

  /**
   * Maps an Archivo entity (or plain object) to the public-facing FileResponseDto.
   *
   * @param {any} archivo - Source Archivo entity or plain object.
   * @returns {FileResponseDto} DTO with all file metadata fields populated.
   */
  private mapToResponseDto(archivo: any): FileResponseDto {
    const dto = new FileResponseDto();
    dto.id = archivo.id;
    dto.nombre = archivo.nombre;
    dto.url = archivo.url;
    dto.tamano = archivo.tamano;
    dto.mimeType = archivo.mimeType;
    dto.fechaSubida = archivo.createdAt;
    dto.urlOptimized = archivo.urlOptimized;
    dto.tamanoOptimized = archivo.tamanoOptimized;
    dto.mimeTypeOptimized = archivo.mimeTypeOptimized;

    if (archivo.usuario) {
      dto.subidoPor = {
        id: archivo.usuario.id,
        nombre: archivo.usuario.nombre,
        username: archivo.usuario.username,
      };
    }
    return dto;
  }
}

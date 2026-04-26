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
 * Documentación en español.
 */
@ApiTags('Archivos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('archivos')
export class ArchivoController {
  constructor(private readonly archivoService: ArchivoService) {}

        /**
     * Documentación en español.
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
     * Documentación en español.
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
     * Documentación en español.
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
     * Documentación en español.
     */
  @Get('content/:filename')
  @Public()
  @ApiOperation({ summary: 'Servir el contenido de un archivo subido' })
  getFileContent(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = this.archivoService.getFileContent(filename);
    res.sendFile(filePath);
  }

        /**
     * Documentación en español.
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
     * Documentación en español.
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

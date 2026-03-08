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
} from '@nestjs/common';
import { ParseUUIDv7Pipe } from '../../../common/pipes';
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
import { RolesGuard } from '../../auth/guards/role.guard';
import { I18nHelper } from '../../../common/helpers/i18n.helper';
import type { Response } from 'express';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';

@ApiTags('Archivos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('archivos')
export class ArchivoController {
  constructor(private readonly archivoService: ArchivoService) {}

  @Post('upload')
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
  @ApiResponse({ status: 201, description: 'Archivo subido correctamente' })
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

  @Get()
  @ApiOperation({ summary: 'Listar archivos' })
  @ApiResponse({ status: 200, description: 'Lista de archivos paginada' })
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

  @Get(':id')
  @ApiOperation({ summary: 'Obtener metadata de un archivo por ID' })
  @ApiResponse({ status: 200, description: 'Detalles del archivo' })
  async findOne(
    @Param('id', ParseUUIDv7Pipe) id: string
  ): Promise<FileResponseDto> {
    const result = await this.archivoService.findOne(id);
    return this.mapToResponseDto(result);
  }

  @Get('content/:filename')
  @ApiOperation({ summary: 'Servir el contenido de un archivo subido' })
  getFileContent(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = this.archivoService.getFileContent(filename);
    res.sendFile(filePath);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un archivo (soft-delete)' })
  @ApiResponse({ status: 204, description: 'Archivo eliminado correctamente' })
  async remove(@Param('id', ParseUUIDv7Pipe) id: string, @Res() res: Response) {
    await this.archivoService.remove(id);
    res.status(HttpStatus.NO_CONTENT).send();
  }

  private mapToResponseDto(archivo: any): FileResponseDto {
    const dto = new FileResponseDto();
    dto.id = archivo.id;
    dto.nombre = archivo.nombre;
    dto.url = archivo.url;
    dto.tamano = archivo.tamano;
    dto.mimeType = archivo.mimeType;
    dto.fechaSubida = archivo.createdAt;

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

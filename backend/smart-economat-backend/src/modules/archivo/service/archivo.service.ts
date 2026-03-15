import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Archivo } from '../archivo.entity/archivo.entity';
import { FileListFilterDto } from '../dto/file-list-filter.dto';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';
import { rolUsuario } from '../../usuario/enums/usuario.enums';
import { I18nHelper } from '../../../common/helpers/i18n.helper';
import * as fs from 'fs';
import * as path from 'path';
import { Jimp, JimpMime } from 'jimp';
import { ImageProcessOptionsDto } from '../dto/image-process-options.dto';

export interface PaginatedFiles {
  data: Archivo[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type ProcessedImageFormat = 'jpeg' | 'png';

@Injectable()
export class ArchivoService {
  private readonly logger = new Logger(ArchivoService.name);
  private readonly storageType: string;
  private readonly uploadDir: string;

  constructor(
    @InjectRepository(Archivo)
    private readonly archivoRepository: Repository<Archivo>,
    private readonly configService: ConfigService
  ) {
    this.storageType = this.configService.get<string>('STORAGE_TYPE', 'local');
    this.uploadDir = this.configService.get<string>(
      'LOCAL_STORAGE_PATH',
      './uploads'
    );
  }

  async uploadFile(
    file: Express.Multer.File,
    user: Usuario,
    processOptions?: ImageProcessOptionsDto,
    shouldProcess: boolean = true
  ): Promise<Archivo> {
    if (!file) {
      throw new BadRequestException(I18nHelper.getError('FILE_REQUIRED'));
    }

    let fileUrl = '';
    let optimizedUrl = '';
    let optimizedSize = 0;
    let optimizedMimeType = '';

    if (this.storageType === 'local') {
      fileUrl = `/api/v1/archivos/content/${file.filename}`;

      if (shouldProcess && file.mimetype.startsWith('image/')) {
        try {
          const options = processOptions || new ImageProcessOptionsDto();
          const processed = await this.processImage(file.path, options);

          optimizedUrl = `/api/v1/archivos/content/${path.basename(processed.path)}`;
          optimizedSize = processed.size;
          optimizedMimeType = processed.mimeType;
        } catch (error) {
          if (process.env.NODE_ENV !== 'test') {
            this.logger.warn(
              `Image optimization skipped for ${file.originalname}: ${error instanceof Error ? error.message : 'unknown error'}`
            );
          }
        }
      }
    } else {
      fileUrl = file.path;
    }

    const newArchivo = this.archivoRepository.create({
      nombre: file.originalname,
      url: fileUrl,
      tamano: file.size,
      mimeType: file.mimetype,
      usuario: user,
      urlOptimized: optimizedUrl || undefined,
      tamanoOptimized: optimizedSize || undefined,
      mimeTypeOptimized: optimizedMimeType || undefined,
    });

    return await this.archivoRepository.save(newArchivo);
  }

  private async processImage(
    inputPath: string,
    options: ImageProcessOptionsDto
  ): Promise<{ path: string; size: number; mimeType: string }> {
    const ext = path.extname(inputPath);
    const dir = path.dirname(inputPath);
    const name = path.basename(inputPath, ext);
    const timestamp = Date.now();

    const outputFormat = this.resolveOutputFormat(options.formatoSalida);
    const outputFileName = `${name}_optimized_${timestamp}.${outputFormat}`;
    const outputPath = path.join(dir, outputFileName);

    const image = await Jimp.read(inputPath);
    const targetWidth = options.ancho
      ? Math.min(options.ancho, image.width)
      : undefined;
    const targetHeight = options.alto
      ? Math.min(options.alto, image.height)
      : undefined;

    if (targetWidth || targetHeight) {
      if (targetWidth && targetHeight) {
        if (options.mantenerAspectRatio !== false) {
          image.scaleToFit({
            w: targetWidth,
            h: targetHeight,
          });
        } else {
          image.resize({
            w: targetWidth,
            h: targetHeight,
          });
        }
      } else if (targetWidth) {
        image.resize({ w: targetWidth });
      } else if (targetHeight) {
        image.resize({ h: targetHeight });
      }
    }

    const mimeType = outputFormat === 'png' ? JimpMime.png : JimpMime.jpeg;
    const outputBuffer =
      outputFormat === 'png'
        ? await image.getBuffer(JimpMime.png)
        : await image.getBuffer(JimpMime.jpeg, {
            quality: this.normalizeQuality(options.calidad),
          });

    await fs.promises.writeFile(outputPath, outputBuffer);

    const stats = fs.statSync(outputPath);

    return {
      path: outputPath,
      size: stats.size,
      mimeType,
    };
  }

  private resolveOutputFormat(
    requestedFormat?: ImageProcessOptionsDto['formatoSalida']
  ): ProcessedImageFormat {
    if (requestedFormat === 'png') {
      return 'png';
    }

    if (requestedFormat === 'webp' && process.env.NODE_ENV !== 'test') {
      this.logger.warn(
        'webp ya no está disponible en el backend; se normaliza a jpeg para mantener compatibilidad multiplataforma'
      );
    }

    return 'jpeg';
  }

  private normalizeQuality(quality?: number): number {
    const normalized = quality ?? 80;

    return Math.max(1, Math.min(100, normalized));
  }

  async findAll(filterDto: FileListFilterDto): Promise<PaginatedFiles> {
    const { page = 1, limit = 20, usuarioId, mimeType } = filterDto;

    const queryBuilder = this.archivoRepository
      .createQueryBuilder('archivo')
      .leftJoinAndSelect('archivo.usuario', 'usuario')
      .where('archivo.isDeleted = :isDeleted', { isDeleted: false });

    if (usuarioId) {
      queryBuilder.andWhere('usuario.id = :usuarioId', { usuarioId });
    }

    if (mimeType) {
      queryBuilder.andWhere('archivo.mimeType = :mimeType', { mimeType });
    }

    queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('archivo.createdAt', 'DESC');

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      data: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Archivo> {
    const archivo = await this.archivoRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['usuario'],
    });

    if (!archivo) {
      throw new NotFoundException(I18nHelper.getError('FILE_NOT_FOUND'));
    }

    return archivo;
  }

  getFileContent(filename: string): string {
    if (this.storageType === 'local') {
      const uploadDirResolved = path.resolve(this.uploadDir);
      const filePath = path.resolve(this.uploadDir, filename);

      if (!filePath.startsWith(uploadDirResolved + path.sep)) {
        throw new BadRequestException(I18nHelper.getError('INVALID_FILE_PATH'));
      }

      if (!fs.existsSync(filePath)) {
        throw new NotFoundException(
          I18nHelper.getError('FILE_NOT_FOUND_PHYSICAL')
        );
      }
      return filePath;
    }
    throw new BadRequestException(
      I18nHelper.getError('STORAGE_TYPE_LOCAL_ONLY')
    );
  }

  async remove(id: string, user: Usuario): Promise<void> {
    const archivo = await this.findOne(id);

    if (
      archivo.usuario?.id !== user.id &&
      user.rol !== rolUsuario.ADMINISTRADOR
    ) {
      throw new ForbiddenException(
        I18nHelper.getError('FILE_DELETE_FORBIDDEN')
      );
    }

    archivo.isDeleted = true;
    await this.archivoRepository.save(archivo);

    await this.archivoRepository.softRemove(archivo);
  }
}

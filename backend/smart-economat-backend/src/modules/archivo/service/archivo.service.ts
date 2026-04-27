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
import { isSherlockElevatedRole } from '../../sherlock-auth/utils/access.utils';
import { I18nHelper } from '../../../common/helpers/i18n.helper';
import * as fs from 'fs';
import * as path from 'path';
import { Jimp } from 'jimp';
import { ImageProcessOptionsDto } from '../dto/image-process-options.dto';
import { resolveWritableLocalStoragePath } from '../../../common/utils/local-storage-path.util';

export interface PaginatedFiles {
  data: Archivo[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type ProcessedImageFormat = 'webp';

/**
 * Documentación en español.
 */
@Injectable()
export class ArchivoService {
  private static webpEncoderInitPromise?: Promise<void>;
  private readonly logger = new Logger(ArchivoService.name);
  private readonly storageType: string;
  private readonly uploadDir: string;

  constructor(
    @InjectRepository(Archivo)
    private readonly archivoRepository: Repository<Archivo>,
    private readonly configService: ConfigService
  ) {
    this.storageType = this.configService.get<string>('STORAGE_TYPE', 'local');
    this.uploadDir = resolveWritableLocalStoragePath(
      this.configService.get<string>('LOCAL_STORAGE_PATH')
    );
  }

  /**
   * Documentación en español.
   */
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
    let fileSize = file.size;
    let fileMimeType = file.mimetype;
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
          fileUrl = optimizedUrl;
          fileSize = processed.size;
          fileMimeType = processed.mimeType;

          await this.deleteLocalFileQuietly(file.path);
        } catch (error) {
          const reason =
            error instanceof Error ? error.message : 'unknown error';

          this.logger.warn(
            `Image optimization failed for ${file.originalname}: ${reason}. Falling back to original file.`
          );
        }
      }
    } else {
      fileUrl = file.path;
    }

    const newArchivo = this.archivoRepository.create({
      nombre: file.originalname,
      url: fileUrl,
      tamano: fileSize,
      mimeType: fileMimeType,
      usuario: user,
      urlOptimized: optimizedUrl || undefined,
      tamanoOptimized: optimizedSize || undefined,
      mimeTypeOptimized: optimizedMimeType || undefined,
    });

    return await this.archivoRepository.save(newArchivo);
  }

  /**
   * Documentación en español.
   */
  async compressImageFile(file: Express.Multer.File): Promise<{
    filename: string;
    path: string;
    size: number;
    mimeType: string;
  }> {
    if (!file.mimetype.startsWith('image/')) {
      return {
        filename: file.filename,
        path: file.path,
        size: file.size,
        mimeType: file.mimetype,
      };
    }

    try {
      const options = new ImageProcessOptionsDto();
      const processed = await this.processImage(file.path, options);

      await this.deleteLocalFileQuietly(file.path);

      return {
        filename: path.basename(processed.path),
        path: processed.path,
        size: processed.size,
        mimeType: processed.mimeType,
      };
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'unknown error';

      this.logger.warn(
        `Image compression failed for ${file.originalname}: ${reason}. Falling back to original file.`
      );

      return {
        filename: file.filename,
        path: file.path,
        size: file.size,
        mimeType: file.mimetype,
      };
    }
  }

  /**
   * Documentación en español.
   */
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

    await this.initializeWebpEncoder();

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

    const mimeType = 'image/webp';
    const { default: encodeWebp } = await this.loadEsmModule<{
      default: (imageData: unknown, options: unknown) => Promise<Uint8Array>;
    }>('@jsquash/webp/encode.js');
    const outputBuffer = Buffer.from(
      await encodeWebp(
        {
          data: new Uint8ClampedArray(image.bitmap.data),
          width: image.bitmap.width,
          height: image.bitmap.height,
          colorSpace: 'srgb',
        },
        {
          quality: this.normalizeQuality(options.calidad),
          alpha_quality: this.normalizeQuality(options.calidad),
        }
      )
    );

    await fs.promises.writeFile(outputPath, outputBuffer);

    const stats = fs.statSync(outputPath);

    return {
      path: outputPath,
      size: stats.size,
      mimeType,
    };
  }

  /**
   * Documentación en español.
   */
  private resolveOutputFormat(
    requestedFormat?: ImageProcessOptionsDto['formatoSalida']
  ): ProcessedImageFormat {
    void requestedFormat;
    return 'webp';
  }

  /**
   * Documentación en español.
   */
  private async initializeWebpEncoder(): Promise<void> {
    if (!ArchivoService.webpEncoderInitPromise) {
      ArchivoService.webpEncoderInitPromise = (async () => {
        const [{ init: initEncoder }, { simd }] = await Promise.all([
          this.loadEsmModule<{
            init: (options: { wasmBinary: Buffer }) => Promise<void>;
          }>('@jsquash/webp/encode.js'),
          this.loadEsmModule<{ simd: () => Promise<boolean> }>(
            'wasm-feature-detect'
          ),
        ]);

        const useSimd = await simd();
        const encoderWasmPath = path.resolve(
          process.cwd(),
          'node_modules/@jsquash/webp/codec/enc',
          useSimd ? 'webp_enc_simd.wasm' : 'webp_enc.wasm'
        );

        const encoderWasm = await fs.promises.readFile(encoderWasmPath);

        await initEncoder({ wasmBinary: encoderWasm });
      })();
    }

    return ArchivoService.webpEncoderInitPromise;
  }

  /**
   * Documentación en español.
   */
  private normalizeQuality(quality?: number): number {
    const normalized = quality ?? 80;

    return Math.max(1, Math.min(100, normalized));
  }

  /**
   * Documentación en español.
   */
  private async loadEsmModule<T>(specifier: string): Promise<T> {
    const moduleNamespace: unknown = await import(specifier);

    if (
      typeof moduleNamespace === 'object' &&
      moduleNamespace !== null &&
      'default' in moduleNamespace
    ) {
      return (moduleNamespace as { default: T }).default;
    }

    return moduleNamespace as T;
  }

  /**
   * Documentación en español.
   */
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

  /**
   * Documentación en español.
   */
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

  /**
   * Documentación en español.
   */
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

  /**
   * Documentación en español.
   */
  async remove(id: string, user: Usuario): Promise<void> {
    const archivo = await this.findOne(id);

    if (archivo.usuario?.id !== user.id && !isSherlockElevatedRole(user.rol)) {
      throw new ForbiddenException(
        I18nHelper.getError('FILE_DELETE_FORBIDDEN')
      );
    }

    archivo.isDeleted = true;
    await this.archivoRepository.save(archivo);

    await this.deleteManagedFiles(archivo);

    await this.archivoRepository.softRemove(archivo);
  }

  /**
   * Documentación en español.
   */
  async cleanupByUrl(fileUrl?: string): Promise<void> {
    if (!fileUrl?.trim()) {
      return;
    }

    const trimmedUrl = fileUrl.trim();
    const archivo = await this.archivoRepository.findOne({
      where: [
        { url: trimmedUrl, isDeleted: false },
        { urlOptimized: trimmedUrl, isDeleted: false },
      ],
    });

    if (archivo) {
      archivo.isDeleted = true;
      await this.archivoRepository.save(archivo);
      await this.deleteManagedFiles(archivo);
      await this.archivoRepository.softRemove(archivo);
      return;
    }

    await this.deletePhysicalFileFromUrl(trimmedUrl);
  }

  /**
   * Documentación en español.
   */
  private async deleteManagedFiles(archivo: Archivo): Promise<void> {
    await this.deletePhysicalFileFromUrl(archivo.url);

    if (archivo.urlOptimized) {
      await this.deletePhysicalFileFromUrl(archivo.urlOptimized);
    }
  }

  /**
   * Documentación en español.
   */
  private async deletePhysicalFileFromUrl(fileUrl?: string): Promise<void> {
    const filename = this.extractFilenameFromUrl(fileUrl);
    if (!filename) {
      return;
    }

    const filePath = path.resolve(this.uploadDir, filename);
    const uploadDirResolved = path.resolve(this.uploadDir);

    if (!filePath.startsWith(uploadDirResolved + path.sep)) {
      return;
    }

    if (!fs.existsSync(filePath)) {
      return;
    }

    try {
      await fs.promises.unlink(filePath);
    } catch (error) {
      this.logger.warn(
        `No se pudo eliminar el archivo físico ${filePath}: ${error instanceof Error ? error.message : 'unknown error'}`
      );
    }
  }

  /**
   * Documentación en español.
   */
  private async deleteLocalFileQuietly(filePath?: string): Promise<void> {
    if (!filePath) {
      return;
    }

    if (!fs.existsSync(filePath)) {
      return;
    }

    try {
      await fs.promises.unlink(filePath);
    } catch (error) {
      this.logger.warn(
        `No se pudo eliminar el archivo temporal ${filePath}: ${error instanceof Error ? error.message : 'unknown error'}`
      );
    }
  }

  /**
   * Documentación en español.
   */
  private extractFilenameFromUrl(fileUrl?: string): string | null {
    if (!fileUrl?.trim()) {
      return null;
    }

    const trimmedUrl = fileUrl.trim();
    const normalizedUrl = trimmedUrl.split('?')[0];
    const uploadsMatch = normalizedUrl.match(/(?:^|\/)uploads\/([^/]+)$/i);
    if (uploadsMatch?.[1]) {
      return uploadsMatch[1];
    }

    const contentMatch = normalizedUrl.match(/\/archivos\/content\/([^/]+)$/i);
    if (contentMatch?.[1]) {
      return contentMatch[1];
    }

    return null;
  }
}

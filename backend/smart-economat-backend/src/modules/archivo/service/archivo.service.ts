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
 * Service that handles file upload, image optimisation, metadata persistence,
 * listing, retrieval, deletion and cleanup of files stored locally.
 * Images are automatically compressed to WebP using @jsquash/webp.
 * Supports both registered (Archivo entity) and unregistered (standalone) compression flows.
 *
 * @class ArchivoService
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
   * Uploads a file, optionally optimises images to WebP, and persists an Archivo record.
   * For local storage the file URL is set to the `/api/v1/archivos/content/<filename>` pattern.
   * When image processing succeeds the original upload is deleted and replaced by the optimised version.
   *
   * @param {Express.Multer.File} file - Uploaded file object from Multer.
   * @param {Usuario} user - Authenticated user who is uploading the file.
   * @param {ImageProcessOptionsDto} [processOptions] - Optional image processing parameters (quality, dimensions, format).
   * @param {boolean} [shouldProcess=true] - Whether to apply image optimisation for image MIME types.
   * @returns {Promise<Archivo>} Persisted Archivo entity with URL and size metadata.
   * @throws {BadRequestException} When no file is provided.
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
   * Comprime un archivo de imagen (JPEG, PNG, GIF, WebP) al formato WebP
   * usando los parámetros por defecto del pipeline de optimización.
   *
   * - Si el archivo no es una imagen, devuelve los datos originales sin modificar.
   * - Si la compresión falla, hace fallback al archivo original con un aviso en log.
   * - El archivo original es eliminado del disco tras una compresión exitosa.
   *
   * Este método es la puerta de entrada compartida para cualquier módulo que
   * necesite comprimir imágenes antes de persistirlas (albaranes, productos, etc.)
   * sin necesidad de pasar por el registro en la entidad Archivo.
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
   * Resizes and converts an image file to WebP using @jsquash/webp.
   * Applies optional dimension constraints while optionally preserving the aspect ratio.
   *
   * @param {string} inputPath - Absolute path to the source image file.
   * @param {ImageProcessOptionsDto} options - Processing options: quality, ancho, alto, mantenerAspectRatio, formatoSalida.
   * @returns {Promise<{ path: string; size: number; mimeType: string }>} Path to the output WebP file and its size.
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
   * Resolves the output image format. Currently always returns 'webp' regardless
   * of the requested format, as only WebP encoding is supported.
   *
   * @param {ImageProcessOptionsDto['formatoSalida']} [requestedFormat] - Requested output format (ignored).
   * @returns {ProcessedImageFormat} Always 'webp'.
   */
  private resolveOutputFormat(
    requestedFormat?: ImageProcessOptionsDto['formatoSalida']
  ): ProcessedImageFormat {
    void requestedFormat;
    return 'webp';
  }

  /**
   * Lazily initialises the @jsquash/webp WASM encoder (once per process lifetime).
   * Detects SIMD support and loads the appropriate WASM binary from the node_modules directory.
   * Subsequent calls return the cached initialisation promise without re-running the setup.
   *
   * @returns {Promise<void>}
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
   * Clamps the quality value to the valid WebP range [1, 100].
   * Defaults to 80 when no value is provided.
   *
   * @param {number} [quality] - Requested quality percentage.
   * @returns {number} Clamped quality value between 1 and 100.
   */
  private normalizeQuality(quality?: number): number {
    const normalized = quality ?? 80;

    return Math.max(1, Math.min(100, normalized));
  }

  /**
   * Dynamically imports an ESM module and unwraps its default export when present.
   * Used to work around the CommonJS/ESM interop boundary for packages such as @jsquash.
   *
   * @template T - Expected type of the imported module or its default export.
   * @param {string} specifier - Module specifier to import (e.g. '@jsquash/webp/encode.js').
   * @returns {Promise<T>} The module's default export if it has one; otherwise the full module namespace.
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
   * Returns a paginated list of active (non-deleted) Archivo records.
   * Supports optional filtering by user ID and MIME type.
   *
   * @param {FileListFilterDto} filterDto - Pagination and filter parameters (page, limit, usuarioId, mimeType).
   * @returns {Promise<PaginatedFiles>} Paginated result containing items and pagination metadata.
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
   * Returns a single active Archivo record by its ID, including the uploader relation.
   *
   * @param {string} id - UUID of the Archivo to retrieve.
   * @returns {Promise<Archivo>} The found Archivo entity.
   * @throws {NotFoundException} When no active file with the given ID exists.
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
   * Resolves the absolute filesystem path for a locally stored file.
   * Validates that the resolved path stays within the configured upload directory
   * to prevent path-traversal attacks.
   *
   * @param {string} filename - Name of the file to serve (no directory components).
   * @returns {string} Absolute path to the file for use with `res.sendFile()`.
   * @throws {BadRequestException} When the filename resolves outside the upload directory or
   *   when the storage type is not 'local'.
   * @throws {NotFoundException} When the file does not exist on disk.
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
   * Soft-deletes an Archivo record and physically removes its associated files from disk.
   * Only the uploader or elevated-role users may delete a file.
   *
   * @param {string} id - UUID of the Archivo to remove.
   * @param {Usuario} user - Authenticated user performing the deletion.
   * @returns {Promise<void>}
   * @throws {NotFoundException} When no active file with the given ID exists.
   * @throws {ForbiddenException} When the requesting user is not the uploader and does not have an elevated role.
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
   * Looks up an Archivo by its URL (original or optimised) and removes it.
   * If no database record is found for the URL, attempts to delete the physical file directly.
   * Silently returns when the URL is empty.
   *
   * @param {string} [fileUrl] - File URL to clean up (may be the original or optimised variant).
   * @returns {Promise<void>}
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
   * Deletes the physical files (original and optimised) associated with an Archivo record.
   *
   * @param {Archivo} archivo - Archivo entity whose physical files should be removed.
   * @returns {Promise<void>}
   */
  private async deleteManagedFiles(archivo: Archivo): Promise<void> {
    await this.deletePhysicalFileFromUrl(archivo.url);

    if (archivo.urlOptimized) {
      await this.deletePhysicalFileFromUrl(archivo.urlOptimized);
    }
  }

  /**
   * Extracts the filename from a file URL and deletes the corresponding physical file
   * from the upload directory. Silently skips when the URL is empty, the path
   * resolves outside the upload directory, or the file does not exist.
   *
   * @param {string} [fileUrl] - URL from which to extract the filename (original or optimised).
   * @returns {Promise<void>}
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
   * Quietly deletes a local file by its absolute path.
   * Logs a warning when the deletion fails but does not throw.
   *
   * @param {string} [filePath] - Absolute path to the file to delete.
   * @returns {Promise<void>}
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
   * Extracts the bare filename from a file URL.
   * Handles two URL patterns:
   * - `/uploads/<filename>` (legacy Multer path)
   * - `/archivos/content/<filename>` (current API path)
   * Returns null when neither pattern matches or the URL is empty.
   *
   * @param {string} [fileUrl] - URL from which to extract the filename.
   * @returns {string | null} The extracted filename, or null when no match is found.
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

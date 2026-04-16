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
 * Servicio que gestiona la subida de archivos, optimización de imágenes, persistencia de metadatos,
 * listado, recuperación, eliminación y limpieza de archivos almacenados localmente.
 * Las imágenes se comprimen automáticamente a WebP usando @jsquash/webp.
 * Admite tanto flujos de compresión registrados (entidad Archivo) como no registrados (independiente).
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
   * Sube un archivo, optimiza opcionalmente las imágenes a WebP y persiste un registro Archivo.
   * Para almacenamiento local, la URL del archivo se establece con el patrón `/api/v1/archivos/content/<filename>`.
   * Cuando el procesamiento de imagen tiene éxito, la subida original se elimina y se reemplaza por la versión optimizada.
   *
   * @param {Express.Multer.File} file - Objeto de archivo subido desde Multer.
   * @param {Usuario} user - Usuario autenticado que está subiendo el archivo.
   * @param {ImageProcessOptionsDto} [processOptions] - Parámetros opcionales de procesamiento de imagen (calidad, dimensiones, formato).
   * @param {boolean} [shouldProcess=true] - Si se debe aplicar la optimización de imagen para tipos MIME de imagen.
   * @returns {Promise<Archivo>} Entidad Archivo persistida con metadatos de URL y tamaño.
   * @throws {BadRequestException} Cuando no se proporciona ningún archivo.
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
   * Redimensiona y convierte un archivo de imagen a WebP usando @jsquash/webp.
   * Aplica restricciones de dimensiones opcionales conservando opcionalmente la relación de aspecto.
   *
   * @param {string} inputPath - Ruta absoluta al archivo de imagen de origen.
   * @param {ImageProcessOptionsDto} options - Opciones de procesamiento: quality, ancho, alto, mantenerAspectRatio, formatoSalida.
   * @returns {Promise<{ path: string; size: number; mimeType: string }>} Ruta al archivo WebP de salida y su tamaño.
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
   * Resuelve el formato de imagen de salida. Actualmente siempre devuelve 'webp' independientemente
   * del formato solicitado, ya que solo se admite la codificación WebP.
   *
   * @param {ImageProcessOptionsDto['formatoSalida']} [requestedFormat] - Formato de salida solicitado (ignorado).
   * @returns {ProcessedImageFormat} Siempre 'webp'.
   */
  private resolveOutputFormat(
    requestedFormat?: ImageProcessOptionsDto['formatoSalida']
  ): ProcessedImageFormat {
    void requestedFormat;
    return 'webp';
  }

  /**
   * Inicializa de forma diferida el codificador WASM de @jsquash/webp (una vez por tiempo de vida del proceso).
   * Detecta el soporte SIMD y carga el binario WASM apropiado desde el directorio node_modules.
   * Las llamadas posteriores devuelven la promesa de inicialización en caché sin volver a ejecutar la configuración.
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
   * Limita el valor de calidad al rango WebP válido [1, 100].
   * Por defecto 80 cuando no se proporciona ningún valor.
   *
   * @param {number} [quality] - Porcentaje de calidad solicitado.
   * @returns {number} Valor de calidad limitado entre 1 y 100.
   */
  private normalizeQuality(quality?: number): number {
    const normalized = quality ?? 80;

    return Math.max(1, Math.min(100, normalized));
  }

  /**
   * Importa dinámicamente un módulo ESM y desenvuelve su exportación por defecto cuando está presente.
   * Se usa para superar la barrera de interoperabilidad CommonJS/ESM para paquetes como @jsquash.
   *
   * @template T - Tipo esperado del módulo importado o su exportación por defecto.
   * @param {string} specifier - Especificador de módulo a importar (p. ej. '@jsquash/webp/encode.js').
   * @returns {Promise<T>} La exportación por defecto del módulo si tiene una; en caso contrario, el espacio de nombres completo del módulo.
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
   * Devuelve una lista paginada de registros Archivo activos (no eliminados).
   * Admite filtrado opcional por ID de usuario y tipo MIME.
   *
   * @param {FileListFilterDto} filterDto - Parámetros de paginación y filtro (page, limit, usuarioId, mimeType).
   * @returns {Promise<PaginatedFiles>} Resultado paginado con los elementos y metadatos de paginación.
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
   * Devuelve un único registro Archivo activo por su ID, incluida la relación del subidor.
   *
   * @param {string} id - UUID del Archivo a recuperar.
   * @returns {Promise<Archivo>} La entidad Archivo encontrada.
   * @throws {NotFoundException} Cuando no existe ningún archivo activo con el ID dado.
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
   * Resuelve la ruta absoluta del sistema de archivos para un archivo almacenado localmente.
   * Valida que la ruta resuelta permanezca dentro del directorio de subida configurado
   * para prevenir ataques de path traversal.
   *
   * @param {string} filename - Nombre del archivo a servir (sin componentes de directorio).
   * @returns {string} Ruta absoluta al archivo para usar con `res.sendFile()`.
   * @throws {BadRequestException} Cuando el nombre de archivo se resuelve fuera del directorio de subida o
   *   cuando el tipo de almacenamiento no es 'local'.
   * @throws {NotFoundException} Cuando el archivo no existe en disco.
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
   * Realiza un borrado lógico del registro Archivo y elimina físicamente sus archivos asociados del disco.
   * Solo el subidor o usuarios con roles elevados pueden eliminar un archivo.
   *
   * @param {string} id - UUID del Archivo a eliminar.
   * @param {Usuario} user - Usuario autenticado que realiza la eliminación.
   * @returns {Promise<void>}
   * @throws {NotFoundException} Cuando no existe ningún archivo activo con el ID dado.
   * @throws {ForbiddenException} Cuando el usuario solicitante no es el subidor y no tiene un rol elevado.
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
   * Busca un Archivo por su URL (original u optimizada) y lo elimina.
   * Si no se encuentra ningún registro en la base de datos para la URL, intenta eliminar el archivo físico directamente.
   * Retorna silenciosamente cuando la URL está vacía.
   *
   * @param {string} [fileUrl] - URL del archivo a limpiar (puede ser la variante original u optimizada).
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
   * Elimina los archivos físicos (original y optimizado) asociados a un registro Archivo.
   *
   * @param {Archivo} archivo - Entidad Archivo cuyos archivos físicos deben eliminarse.
   * @returns {Promise<void>}
   */
  private async deleteManagedFiles(archivo: Archivo): Promise<void> {
    await this.deletePhysicalFileFromUrl(archivo.url);

    if (archivo.urlOptimized) {
      await this.deletePhysicalFileFromUrl(archivo.urlOptimized);
    }
  }

  /**
   * Extrae el nombre de archivo de una URL de archivo y elimina el archivo físico correspondiente
   * del directorio de subida. Omite silenciosamente cuando la URL está vacía, la ruta
   * se resuelve fuera del directorio de subida o el archivo no existe.
   *
   * @param {string} [fileUrl] - URL de la que extraer el nombre de archivo (original u optimizada).
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
   * Elimina silenciosamente un archivo local por su ruta absoluta.
   * Registra una advertencia cuando la eliminación falla pero no lanza excepciones.
   *
   * @param {string} [filePath] - Ruta absoluta al archivo a eliminar.
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
   * Extrae el nombre de archivo sin directorio de una URL de archivo.
   * Gestiona dos patrones de URL:
   * - `/uploads/<filename>` (ruta Multer heredada)
   * - `/archivos/content/<filename>` (ruta API actual)
   * Devuelve null cuando ningún patrón coincide o la URL está vacía.
   *
   * @param {string} [fileUrl] - URL de la que extraer el nombre de archivo.
   * @returns {string | null} El nombre de archivo extraído, o null cuando no se encuentra coincidencia.
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

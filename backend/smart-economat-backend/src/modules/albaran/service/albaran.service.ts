/**
 * @module AlbaranService
 * Service layer for managing delivery notes (albaranes), including creation,
 * retrieval, update, soft-deletion, document upload and concordance synchronisation.
 */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, EntityManager } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Albaran } from '../albaran.entity/albaran.entity';
import { CreateAlbaranDto } from '../dto/create-albaran.dto';
import { UpdateAlbaranDto } from '../dto/update-albaran.dto';
import { UploadAlbaranDto } from '../dto/upload-albaran.dto';
import { I18nHelper } from '../../../common/helpers/i18n.helper';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { Recepcion } from '../../recepcion/recepcion.entity/recepcion.entity';
import { RecepcionPedido } from '../../recepcion/recepcion-pedido.entity/recepcion-pedido.entity';
import { EstadoRecepcion } from '../../recepcion/enums/estado-recepcion.enum';
import { AlbaranPedidoRecepcion } from '../albaran-pedido-recepcion.entity/albaran-pedido-recepcion.entity';
import { ArchivoService } from '../../archivo/service/archivo.service';
import * as fs from 'fs';
import * as path from 'path';

const ALBARAN_CONCORDANCIA_RELATIONS = [
  'albaranPedidoRecepcion',
  'albaranPedidoRecepcion.recepcionPedido',
  'albaranPedidoRecepcion.recepcionPedido.recepcion',
] as const;

const ALBARAN_DETAIL_RELATIONS = [
  ...ALBARAN_CONCORDANCIA_RELATIONS,
  'albaranPedidoRecepcion.recepcionPedido.recepcion.recepcionProductos',
  'albaranPedidoRecepcion.recepcionPedido.recepcion.recepcionProductos.pedidoProducto',
  'albaranPedidoRecepcion.recepcionPedido.recepcion.recepcionProductos.pedidoProducto.productoProveedor',
  'albaranPedidoRecepcion.recepcionPedido.recepcion.recepcionProductos.pedidoProducto.productoProveedor.producto',
  'albaranPedidoRecepcion.recepcionPedido.recepcion.recepcionProductos.pedidoProducto.productoProveedor.proveedor',
] as const;

/**
 * Service responsible for all business logic related to delivery notes (albaranes).
 * Handles CRUD operations, document uploads, automatic numbering and
 * concordance synchronisation with associated recepciones.
 * @class AlbaranService
 */
@Injectable()
export class AlbaranService {
  private readonly logger = new Logger(AlbaranService.name);

  /**
   * Constructs the AlbaranService with its required dependencies.
   * @param {Repository<Albaran>} albaranRepository - TypeORM repository for Albaran entity.
   * @param {DataSource} dataSource - TypeORM DataSource used to create query runners and transactions.
   * @param {ConfigService} configService - NestJS ConfigService for reading env variables.
   * @param {ArchivoService} archivoService - Service for file compression and management.
   */
  constructor(
    @InjectRepository(Albaran)
    private readonly albaranRepository: Repository<Albaran>,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly archivoService: ArchivoService
  ) {}

  /**
   * Creates and persists a new Albaran from the provided DTO.
   * @param {CreateAlbaranDto} dto - Data transfer object containing albaran fields.
   * @returns {Promise<Albaran>} The newly created Albaran entity.
   */
  async create(dto: CreateAlbaranDto): Promise<Albaran> {
    const albaran = this.albaranRepository.create(dto);
    return await this.albaranRepository.save(albaran);
  }

  /**
   * Finds an existing Albaran by reference number or creates a new one if none exists.
   * When no reference number is provided, an automatic sequential number is generated.
   * @param {object} params - Parameters for finding or creating the albaran.
   * @param {string} [params.numeroReferencia] - Optional reference number. If omitted, an automatic number is generated.
   * @param {Date} [params.fecha] - Optional date to assign to the albaran. Defaults to now.
   * @param {EntityManager} [params.manager] - Optional EntityManager to use within an active transaction.
   * @returns {Promise<Albaran>} The found or newly created Albaran entity.
   */
  async createOrGetAlbaran(params: {
    numeroReferencia?: string;
    fecha?: Date;
    manager?: EntityManager;
  }): Promise<Albaran> {
    const { numeroReferencia, fecha, manager } = params;
    const repo = manager
      ? manager.getRepository(Albaran)
      : this.albaranRepository;

    let nAlbaran = numeroReferencia;
    let esAutomatico = false;

    if (!nAlbaran) {
      nAlbaran = await this.generateAutomaticNumber(repo);
      esAutomatico = true;
    }

    let albaran = await repo.findOne({ where: { nAlbaran } });

    if (!albaran) {
      albaran = repo.create({
        nAlbaran,
        fecha: fecha || new Date(),
        esAutomatico,
      });
      albaran = await repo.save(albaran);
    }

    return albaran;
  }

  /**
   * Generates a unique sequential albaran number with the format `AUTO-{YEAR}-{NNNNN}`.
   * Falls back to a random 6-digit number if the last sequence cannot be parsed.
   * @param {Repository<Albaran>} repo - The Albaran repository (may belong to a transaction).
   * @returns {Promise<string>} A unique automatic albaran number string.
   */
  private async generateAutomaticNumber(
    repo: Repository<Albaran>
  ): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `AUTO-${year}-`;

    const lastAlbaran = await repo
      .createQueryBuilder('albaran')
      .where('albaran.n_albaran LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('albaran.createdAt', 'DESC')
      .getOne();

    let sequence = 1;
    if (lastAlbaran) {
      const parts = lastAlbaran.nAlbaran.split('-');
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) {
        sequence = lastSeq + 1;
      } else {
        sequence = Math.floor(Math.random() * 1000000);
      }
    }

    const paddedSeq = sequence.toString().padStart(5, '0');
    return `${prefix}${paddedSeq}`;
  }

  /**
   * Derives the concordancia value for an already-loaded Albaran by inspecting
   * the state and incidencia flag of its linked recepciones.
   * Returns `undefined` when no recepciones are linked (concordancia cannot be determined).
   * @param {Albaran} albaran - An Albaran entity with `albaranPedidoRecepcion` relations loaded.
   * @returns {boolean | undefined} `true` if all recepciones are COMPLETADA without incidencia,
   *   `false` if any recepcion fails the check, `undefined` if no recepciones are linked.
   */
  private deriveConcordanciaFromLinks(albaran: Albaran): boolean | undefined {
    const recepciones = (albaran.albaranPedidoRecepcion ?? [])
      .map((link) => link.recepcionPedido?.recepcion)
      .filter((recepcion): recepcion is Recepcion => Boolean(recepcion));

    if (recepciones.length === 0) {
      return undefined;
    }

    return recepciones.every(
      (recepcion) =>
        recepcion.estado === EstadoRecepcion.COMPLETADA &&
        recepcion.incidencia === false
    );
  }

  /**
   * Synchronises the `concordancia` field of a loaded Albaran entity and persists
   * the change if it differs from the derived value.
   * @param {Repository<Albaran>} repo - The Albaran repository (may belong to a transaction).
   * @param {Albaran} albaran - An Albaran entity with concordancia relations loaded.
   * @returns {Promise<Albaran>} The Albaran entity with the `concordancia` field up to date.
   */
  private async syncLoadedAlbaranConcordancia(
    repo: Repository<Albaran>,
    albaran: Albaran
  ): Promise<Albaran> {
    const derivedConcordancia = this.deriveConcordanciaFromLinks(albaran);

    if (derivedConcordancia === undefined) {
      return albaran;
    }

    if (albaran.concordancia !== derivedConcordancia) {
      albaran.concordancia = derivedConcordancia;
      return await repo.save(albaran);
    }

    albaran.concordancia = derivedConcordancia;
    return albaran;
  }

  /**
   * Loads an Albaran by ID, re-derives its concordancia from linked recepciones,
   * persists any change, and returns the updated entity.
   * @param {string} albaranId - UUID of the Albaran to synchronise.
   * @param {EntityManager} [manager] - Optional EntityManager to use within an active transaction.
   * @returns {Promise<Albaran>} The Albaran with `concordancia` synchronised.
   * @throws {NotFoundException} If no Albaran with the given ID exists.
   */
  async syncConcordanciaFromRecepciones(
    albaranId: string,
    manager?: EntityManager
  ): Promise<Albaran> {
    const repo = manager
      ? manager.getRepository(Albaran)
      : this.albaranRepository;

    const albaran = await repo.findOne({
      where: { id: albaranId },
      relations: [...ALBARAN_CONCORDANCIA_RELATIONS],
    });

    if (!albaran) {
      throw new NotFoundException(I18nHelper.getError('ALBARAN_NOT_FOUND'));
    }

    return await this.syncLoadedAlbaranConcordancia(repo, albaran);
  }

  /**
   * Returns a paginated list of albaranes, optionally including soft-deleted records
   * for admin and super-admin roles. Each albaran has its concordancia synchronised.
   * @param {PaginationQueryDto} query - Pagination, sort, and order parameters.
   * @param {string} [userRole] - Role of the requesting user; admins see soft-deleted records.
   * @returns {Promise<PaginatedResponseDto<Albaran>>} Paginated result containing albaranes and metadata.
   */
  async findAll(
    query: PaginationQueryDto,
    userRole?: string
  ): Promise<PaginatedResponseDto<Albaran>> {
    const isAdmin =
      userRole?.toUpperCase() === 'ADMIN' ||
      userRole?.toUpperCase() === 'SUPER_ADMIN';
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 50);
    const sortBy = query.sortBy ?? 'fecha';
    const order = query.order ?? 'DESC';

    const [data, total] = await this.albaranRepository.findAndCount({
      relations: [...ALBARAN_CONCORDANCIA_RELATIONS],
      withDeleted: isAdmin,
      order: { [sortBy]: order },
      skip: (page - 1) * limit,
      take: limit,
    });

    const albaranes = await Promise.all(
      data.map((albaran) =>
        this.syncLoadedAlbaranConcordancia(this.albaranRepository, albaran)
      )
    );

    return {
      data: albaranes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Finds a single Albaran by its UUID, optionally loading full product detail relations.
   * Synchronises the concordancia before returning.
   * @param {string} id - UUID of the Albaran to retrieve.
   * @param {string} [_userRole] - Role of the requesting user (reserved, currently unused).
   * @param {boolean} [includeProductos=false] - When `true`, loads full product detail relations.
   * @returns {Promise<Albaran>} The found Albaran entity with concordancia synchronised.
   * @throws {NotFoundException} If no Albaran with the given ID exists.
   */
  async findOne(
    id: string,
    _userRole?: string,
    includeProductos = false
  ): Promise<Albaran> {
    void _userRole;

    const relations = includeProductos
      ? ALBARAN_DETAIL_RELATIONS
      : ALBARAN_CONCORDANCIA_RELATIONS;

    const albaran = await this.albaranRepository.findOne({
      where: { id },
      relations: [...relations],
    });

    if (!albaran) {
      throw new NotFoundException(I18nHelper.getError('ALBARAN_NOT_FOUND'));
    }

    return await this.syncLoadedAlbaranConcordancia(
      this.albaranRepository,
      albaran
    );
  }

  /**
   * Merges the provided DTO fields into an existing Albaran and persists the changes.
   * @param {string} id - UUID of the Albaran to update.
   * @param {UpdateAlbaranDto} dto - Partial data to merge into the existing entity.
   * @returns {Promise<Albaran>} The updated Albaran entity.
   * @throws {NotFoundException} If no Albaran with the given ID exists.
   */
  async update(id: string, dto: UpdateAlbaranDto): Promise<Albaran> {
    const albaran = await this.findOne(id);
    this.albaranRepository.merge(albaran, dto);
    return this.albaranRepository.save(albaran);
  }

  /**
   * Soft-deletes an Albaran, making it invisible in standard queries.
   * @param {string} id - UUID of the Albaran to remove.
   * @returns {Promise<void>}
   * @throws {NotFoundException} If no Albaran with the given ID exists.
   */
  async remove(id: string): Promise<void> {
    const albaran = await this.findOne(id);
    await this.albaranRepository.softDelete(albaran.id);
  }

  /**
   * Sube un documento (foto o PDF) de un albarán.
   *
   * Flujo:
   * 1. Valida que se proporcionó un archivo válido
   * 2. Busca o crea el Albaran por número de referencia
   * 3. Valida que no tenga ya un documento adjunto (evita duplicados)
   * 4. Si se proporciona recepcionId, valida que la Recepción exista y los vincula
   * 5. Guarda la referencia del archivo en la entidad Albaran
   * 6. Todo se ejecuta dentro de una transacción
   *
   * @param {Express.Multer.File} file - Archivo subido mediante Multer.
   * @param {UploadAlbaranDto} dto - Datos del albarán (numeroReferencia, recepcionId, observaciones).
   * @returns {Promise<Albaran>} Albaran actualizado con la info del documento.
   * @throws {BadRequestException} If no file is provided or the upload fails unexpectedly.
   * @throws {NotFoundException} If the recepcionId does not correspond to an existing Recepcion.
   * @throws {ConflictException} If the albaran already has an attached document.
   */
  async uploadDocumento(
    file: Express.Multer.File,
    dto: UploadAlbaranDto
  ): Promise<Albaran> {
    if (!file) {
      throw new BadRequestException(I18nHelper.getError('FILE_REQUIRED'));
    }

    const processedFile = await this.archivoService.compressImageFile(file);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let albaran = await queryRunner.manager.findOne(Albaran, {
        where: { nAlbaran: dto.numeroReferencia },
        lock: { mode: 'pessimistic_write' },
      });

      if (!albaran) {
        albaran = queryRunner.manager.create(Albaran, {
          nAlbaran: dto.numeroReferencia,
          fecha: new Date(),
        });
        albaran = await queryRunner.manager.save(albaran);
        this.logger.log(
          `Albarán "${dto.numeroReferencia}" creado automáticamente`
        );
      }

      if (albaran.documentoUrl) {
        this.deleteFileQuietly(processedFile.path);

        throw new ConflictException(
          I18nHelper.getError('ALBARAN_ALREADY_HAS_DOCUMENT', {
            nAlbaran: dto.numeroReferencia,
          })
        );
      }

      if (dto.recepcionId) {
        const recepcion = await queryRunner.manager.findOne(Recepcion, {
          where: { id: dto.recepcionId },
          relations: ['recepcionesPedidos'],
        });

        if (!recepcion) {
          this.deleteFileQuietly(file.path);
          throw new NotFoundException(
            I18nHelper.getError('RECEPTION_NOT_FOUND')
          );
        }

        const recepcionesPedidos = await queryRunner.manager.find(
          RecepcionPedido,
          {
            where: { recepcionId: dto.recepcionId },
          }
        );

        for (const rp of recepcionesPedidos) {
          const existingLink = await queryRunner.manager.findOne(
            AlbaranPedidoRecepcion,
            {
              where: {
                albaranId: albaran.id,
                recepcionPedidoId: rp.id,
              },
            }
          );

          if (!existingLink) {
            const link = queryRunner.manager.create(AlbaranPedidoRecepcion, {
              albaran: albaran,
              recepcionPedido: rp,
            });
            await queryRunner.manager.save(link);
          }
        }
      }

      albaran = await this.syncConcordanciaFromRecepciones(
        albaran.id,
        queryRunner.manager
      );

      const fileUrl = `/api/v1/albaranes/documento/${processedFile.filename}`;

      albaran.documentoUrl = fileUrl;
      albaran.documentoNombre = file.originalname;
      albaran.documentoMimeType = processedFile.mimeType;
      albaran.documentoTamano = processedFile.size;

      const savedAlbaran = await queryRunner.manager.save(albaran);

      await queryRunner.commitTransaction();

      this.logger.log(
        `Documento "${file.originalname}" subido para albarán "${dto.numeroReferencia}" (${(file.size / 1024).toFixed(1)} KB)`
      );

      return savedAlbaran;
    } catch (error: unknown) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }

      if (
        !(error instanceof ConflictException) &&
        !(error instanceof NotFoundException)
      ) {
        this.deleteFileQuietly(processedFile.path);
      }

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      const err = error as Error;
      this.logger.error(
        `Error al subir documento de albarán: ${err.message}`,
        err.stack
      );
      throw new BadRequestException(
        I18nHelper.getError('ALBARAN_UPLOAD_FAILED', { message: err.message })
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Resolves the absolute filesystem path for a stored albaran document and validates
   * that the path is within the configured upload directory and that the file exists.
   * @param {string} filename - The filename (not the full path) of the stored document.
   * @returns {string} Absolute path to the file on disk.
   * @throws {BadRequestException} If the resolved path is outside the upload directory (path traversal attempt).
   * @throws {NotFoundException} If the file does not exist on disk.
   */
  getDocumentoPath(filename: string): string {
    const uploadDir = this.configService.get<string>(
      'LOCAL_STORAGE_PATH',
      './uploads'
    );
    const uploadDirResolved = path.resolve(uploadDir);
    const filePath = path.resolve(uploadDir, filename);

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

  /**
   * Elimina un archivo del disco de forma silenciosa (sin lanzar error si falla).
   * Used as cleanup when an upload transaction fails or a conflict is detected.
   * @param {string} filePath - Absolute path to the file that should be removed.
   * @returns {void}
   */
  private deleteFileQuietly(filePath: string): void {
    try {
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      this.logger.warn(
        `No se pudo eliminar archivo huérfano: ${filePath}`,
        err
      );
    }
  }
}

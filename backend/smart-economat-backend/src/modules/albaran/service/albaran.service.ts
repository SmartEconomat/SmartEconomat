/**
 * Documentación en español.
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
 * Documentación en español.
 */
@Injectable()
export class AlbaranService {
  private readonly logger = new Logger(AlbaranService.name);

        /**
     * Documentación en español.
     */
  constructor(
    @InjectRepository(Albaran)
    private readonly albaranRepository: Repository<Albaran>,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly archivoService: ArchivoService
  ) {}

        /**
     * Documentación en español.
     */
  async create(dto: CreateAlbaranDto): Promise<Albaran> {
    const albaran = this.albaranRepository.create(dto);
    return await this.albaranRepository.save(albaran);
  }

        /**
     * Documentación en español.
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
     * Documentación en español.
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
     * Documentación en español.
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
     * Documentación en español.
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
     * Documentación en español.
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
     * Documentación en español.
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
     * Documentación en español.
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
     * Documentación en español.
     */
  async update(id: string, dto: UpdateAlbaranDto): Promise<Albaran> {
    const albaran = await this.findOne(id);
    this.albaranRepository.merge(albaran, dto);
    return this.albaranRepository.save(albaran);
  }

        /**
     * Documentación en español.
     */
  async remove(id: string): Promise<void> {
    const albaran = await this.findOne(id);
    await this.albaranRepository.softDelete(albaran.id);
  }

        /**
     * Documentación en español.
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
     * Documentación en español.
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
     * Documentación en español.
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

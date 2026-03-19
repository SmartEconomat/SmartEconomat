import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
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
import { AlbaranPedidoRecepcion } from '../albaran-pedido-recepcion.entity/albaran-pedido-recepcion.entity';
import * as fs from 'fs';

@Injectable()
export class AlbaranService {
  private readonly logger = new Logger(AlbaranService.name);

  constructor(
    @InjectRepository(Albaran)
    private readonly albaranRepository: Repository<Albaran>,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService
  ) {}

  async create(dto: CreateAlbaranDto): Promise<Albaran> {
    const albaran = this.albaranRepository.create(dto);
    return await this.albaranRepository.save(albaran);
  }

  async findAll(
    query: PaginationQueryDto,
    userRole?: string
  ): Promise<PaginatedResponseDto<Albaran>> {
    const isAdmin =
      userRole?.toUpperCase() === 'ADMIN' ||
      userRole?.toUpperCase() === 'ADMINISTRADOR' ||
      userRole?.toUpperCase() === 'SUPER_ADMIN';
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 50);
    const sortBy = query.sortBy ?? 'fecha';
    const order = query.order ?? 'DESC';

    const [data, total] = await this.albaranRepository.findAndCount({
      relations: ['albaranPedidoRecepcion'],
      withDeleted: isAdmin,
      order: { [sortBy]: order },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findOne(id: string, _userRole?: string): Promise<Albaran> {
    void _userRole;

    const albaran = await this.albaranRepository.findOne({
      where: { id },
      relations: ['albaranPedidoRecepcion'],
    });

    if (!albaran) {
      throw new NotFoundException(I18nHelper.getError('ALBARAN_NOT_FOUND'));
    }

    return albaran;
  }

  async update(id: string, dto: UpdateAlbaranDto): Promise<Albaran> {
    const albaran = await this.findOne(id);
    this.albaranRepository.merge(albaran, dto);
    return this.albaranRepository.save(albaran);
  }

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
   * @param file - Archivo subido mediante Multer
   * @param dto - Datos del albarán (numeroReferencia, recepcionId, observaciones)
   * @returns Albaran actualizado con la info del documento
   */
  async uploadDocumento(
    file: Express.Multer.File,
    dto: UploadAlbaranDto
  ): Promise<Albaran> {
    if (!file) {
      throw new BadRequestException(I18nHelper.getError('FILE_REQUIRED'));
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let albaran = await queryRunner.manager.findOne(Albaran, {
        where: { nAlbaran: dto.numeroReferencia },
        relations: ['albaranPedidoRecepcion'],
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
        this.deleteFileQuietly(file.path);

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

      const fileUrl = `/api/v1/archivos/content/${file.filename}`;

      albaran.documentoUrl = fileUrl;
      albaran.documentoNombre = file.originalname;
      albaran.documentoMimeType = file.mimetype;
      albaran.documentoTamano = file.size;

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
        this.deleteFileQuietly(file.path);
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
   * Elimina un archivo del disco de forma silenciosa (sin lanzar error si falla).
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

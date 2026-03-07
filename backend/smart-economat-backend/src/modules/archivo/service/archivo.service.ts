import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
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

export interface PaginatedFiles {
  data: Archivo[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class ArchivoService {
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

  async uploadFile(file: Express.Multer.File, user: Usuario): Promise<Archivo> {
    if (!file) {
      throw new BadRequestException(I18nHelper.getError('FILE_REQUIRED'));
    }

    let fileUrl = '';
    if (this.storageType === 'local') {
      fileUrl = `/api/v1/archivos/content/${file.filename}`;
    } else {
      fileUrl = file.path;
    }

    const newArchivo = this.archivoRepository.create({
      nombre: file.originalname,
      url: fileUrl,
      tamano: file.size,
      mimeType: file.mimetype,
      usuario: user,
    });

    return await this.archivoRepository.save(newArchivo);
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
      const filePath = path.resolve(this.uploadDir, filename);
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

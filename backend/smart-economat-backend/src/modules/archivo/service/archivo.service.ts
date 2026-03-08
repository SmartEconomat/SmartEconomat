import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Archivo } from '../entities/archivo.entity';
import { FileListFilterDto } from '../dto/file-list-filter.dto';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';

@Injectable()
export class ArchivoService {
  constructor(
    @InjectRepository(Archivo)
    private readonly archivoRepo: Repository<Archivo>
  ) {}

  async uploadFile(file: any, user: Usuario): Promise<Archivo> {
    const archivo = this.archivoRepo.create({
      nombre: (file as { originalname: string }).originalname,
      url: `/uploads/${(file as { filename: string }).filename}`,
      tamano: (file as { size: number }).size,
      mimeType: (file as { mimetype: string }).mimetype,
      usuario: user,
    });
    return this.archivoRepo.save(archivo);
  }

  async findAll(filter: FileListFilterDto): Promise<{
    data: Archivo[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const [data, total] = await this.archivoRepo.findAndCount({
      take: filter.limit || 10,
      skip: ((filter.page || 1) - 1) * (filter.limit || 10),
      relations: ['usuario'],
    });

    return {
      data,
      total,
      page: filter.page || 1,
      limit: filter.limit || 10,
      totalPages: Math.ceil(total / (filter.limit || 10)),
    };
  }

  async findOne(id: string): Promise<Archivo> {
    const result = await this.archivoRepo.findOne({
      where: { id },
      relations: ['usuario'],
    });
    if (!result) throw new NotFoundException('Archivo no encontrado');
    return result;
  }

  getFileContent(filename: string): string {
    return `./uploads/${filename}`;
  }

  async remove(id: string): Promise<void> {
    const result = await this.findOne(id);
    await this.archivoRepo.softRemove(result);
  }
}

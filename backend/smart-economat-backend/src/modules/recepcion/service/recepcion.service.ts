import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Recepcion } from '../recepcion.entity/recepcion.entity';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';
import { CreateRecepcionDto } from '../dto/create-recepcion.dto';
import { UpdateRecepcionDto } from '../dto/update-recepcion.dto';

@Injectable()
export class RecepcionService {
  constructor(
    @InjectRepository(Recepcion)
    private readonly recepcionRepository: Repository<Recepcion>,

    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>
  ) {}

  async create(dto: CreateRecepcionDto): Promise<Recepcion> {
    const usuario = await this.usuarioRepository.findOne({
      where: { id: dto.usuarioId },
    });

    if (!usuario) {
      throw new BadRequestException('El usuario no existe');
    }

    const recepcion = this.recepcionRepository.create({
      fechaRecepcion: dto.fechaRecepcion,
      observaciones: dto.observaciones,
      usuario,
    });

    return await this.recepcionRepository.save(recepcion);
  }

  async findAll(): Promise<Recepcion[]> {
    return await this.recepcionRepository.find({
      relations: ['usuario'],
      withDeleted: false,
    });
  }

  async findOne(id: string): Promise<Recepcion> {
    const recepcion = await this.recepcionRepository.findOne({
      where: { id },
      relations: ['usuario'],
    });

    if (!recepcion) {
      throw new NotFoundException('Recepción no encontrada');
    }

    return recepcion;
  }

  async update(id: string, dto: UpdateRecepcionDto): Promise<Recepcion> {
    const recepcion = await this.findOne(id);

    if (dto.usuarioId) {
      const usuario = await this.usuarioRepository.findOne({
        where: { id: dto.usuarioId },
      });

      if (!usuario) {
        throw new BadRequestException('El usuario no existe');
      }

      recepcion.usuario = usuario;
    }

    this.recepcionRepository.merge(recepcion, dto);

    return await this.recepcionRepository.save(recepcion);
  }

  async remove(id: string): Promise<void> {
    const recepcion = await this.recepcionRepository.findOne({
      where: { id },
      relations: ['recepcionesPedido', 'recepcionesProducto'],
    });

    if (!recepcion) {
      throw new NotFoundException('Recepción no encontrada');
    }

    if (
      recepcion.recepcionesPedido?.length ||
      recepcion.recepcionesProducto?.length
    ) {
      throw new BadRequestException(
        'No se puede eliminar la recepción porque tiene relaciones asociadas'
      );
    }

    await this.recepcionRepository.softDelete(id);
  }
}

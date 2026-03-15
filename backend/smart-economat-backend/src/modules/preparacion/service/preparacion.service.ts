import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PreparacionEntity } from '../preparacion.entity';
import { CreatePreparacionDto } from '../dto/create-preparacion.dto';
import { UpdatePreparacionDto } from '../dto/update-preparacion.dto';
import { Producto } from '../../producto/producto.entity/producto.entity';

@Injectable()
export class PreparacionService {
  constructor(
    @InjectRepository(PreparacionEntity)
    private readonly preparacionRepository: Repository<PreparacionEntity>,
    @InjectRepository(Producto)
    private readonly productoRepository: Repository<Producto>
  ) {}

  async create(dto: CreatePreparacionDto): Promise<PreparacionEntity> {
    const ingredientes = await this.productoRepository.findByIds(
      dto.ingredientes
    );
    if (ingredientes.length !== dto.ingredientes.length) {
      throw new BadRequestException('Uno o más ingredientes no existen');
    }
    const preparacion = this.preparacionRepository.create({
      ...dto,
      ingredientes,
    });
    return this.preparacionRepository.save(preparacion);
  }

  async findAll(): Promise<PreparacionEntity[]> {
    return this.preparacionRepository.find();
  }

  async findOne(uuid: string): Promise<PreparacionEntity> {
    const preparacion = await this.preparacionRepository.findOne({
      where: { uuid },
    });
    if (!preparacion) throw new NotFoundException('Preparación no encontrada');
    return preparacion;
  }

  async update(
    uuid: string,
    dto: UpdatePreparacionDto
  ): Promise<PreparacionEntity> {
    const preparacion = await this.findOne(uuid);
    if (dto.ingredientes) {
      const ingredientes = await this.productoRepository.findByIds(
        dto.ingredientes
      );
      if (ingredientes.length !== dto.ingredientes.length) {
        throw new BadRequestException('Uno o más ingredientes no existen');
      }
      preparacion.ingredientes = ingredientes;
    }
    Object.assign(preparacion, dto);
    return this.preparacionRepository.save(preparacion);
  }

  async remove(uuid: string): Promise<void> {
    const preparacion = await this.findOne(uuid);
    await this.preparacionRepository.remove(preparacion);
  }

  async calcularCoste(uuid: string): Promise<number> {
    const preparacion = await this.findOne(uuid);
    if (!preparacion.ingredientes || preparacion.ingredientes.length === 0) {
      return 0;
    }
    let total = 0;
    for (const prod of preparacion.ingredientes) {
      total +=
        typeof (prod as any).costeEstimado === 'number'
          ? (prod as any).costeEstimado
          : 0;
    }
    return total;
  }

  async ejecutarPreparacion(uuid: string, cantidad = 1): Promise<void> {
    const preparacion = await this.findOne(uuid);

    for (const ingrediente of preparacion.ingredientes) {
      if (((ingrediente as any).stockActual || 0) < cantidad) {
        throw new ForbiddenException(
          `Stock insuficiente para ${(ingrediente as any).nombre}`
        );
      }
      (ingrediente as any).stockActual -= cantidad;
      await this.productoRepository.save(ingrediente);
    }
  }
}

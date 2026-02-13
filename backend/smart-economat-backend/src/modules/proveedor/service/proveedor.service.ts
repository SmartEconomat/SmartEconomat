import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Proveedor } from '../proveedor.entity/proveedor.entity';
import { ProveedorRepository } from '../repository/proveedor.repository';
import { CreateProveedorDto } from '../dto/create-proveedor.dto';
import { UpdateProveedorDto } from '../dto/update-proveedor.dto';

@Injectable()
export class ProveedorService {
  constructor(private readonly proveedorRepository: ProveedorRepository) {}

  async create(createProveedorDto: CreateProveedorDto): Promise<Proveedor> {
    const proveedor = this.proveedorRepository.create(createProveedorDto);
    return await this.proveedorRepository.save(proveedor);
  }

  async findAll(): Promise<Proveedor[]> {
    return await this.proveedorRepository.find({
      relations: ['productos'],
    });
  }

  async findOne(id: number): Promise<Proveedor> {
    const proveedor = await this.proveedorRepository.findOne({
      where: { id },
      relations: ['productos'],
    });

    if (!proveedor) {
      throw new NotFoundException('Proveedor no encontrado');
    }

    return proveedor;
  }

  async update(
    id: number,
    updateProveedorDto: UpdateProveedorDto
  ): Promise<Proveedor> {
    const proveedor = await this.findOne(id);

    this.proveedorRepository.merge(proveedor, updateProveedorDto);
    return await this.proveedorRepository.save(proveedor);
  }

  async remove(id: number): Promise<void> {
    const proveedor = await this.findOne(id);

    if (proveedor.productos && proveedor.productos.length > 0) {
      throw new BadRequestException(
        'No se puede eliminar el proveedor porque tiene productos asociados'
      );
    }

    await this.proveedorRepository.remove(proveedor);
  }
}

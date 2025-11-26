import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProveedorRepository } from '../repository/proveedor.repository';
import { CreateProveedorDto } from '../dto/create-proveedor.dto';
import { UpdateProveedorDto } from '../dto/update-proveedor.dto';
import { Proveedor } from '../proveedor.entity/proveedor.entity';

@Injectable()
export class ProveedorService {
  constructor(
    @InjectRepository(ProveedorRepository)
    private proveedorRepository: ProveedorRepository
  ) {}

  async create(createProveedorDto: CreateProveedorDto): Promise<Proveedor> {
    const proveedor = this.proveedorRepository.create(createProveedorDto);
    return await this.proveedorRepository.save(proveedor);
  }

  async findAll(): Promise<Proveedor[]> {
    return await this.proveedorRepository.find();
  }

  async findOne(id: number): Promise<Proveedor> {
    const proveedor = await this.proveedorRepository.findOne({
      where: { id },
    });

    if (!proveedor) {
      throw new NotFoundException(`Proveedor con ID ${id} no encontrado`);
    }

    return proveedor;
  }

  async update(
    id: number,
    updateProveedorDto: UpdateProveedorDto
  ): Promise<Proveedor> {
    const proveedor = await this.findOne(id);

    Object.assign(proveedor, updateProveedorDto);

    return await this.proveedorRepository.save(proveedor);
  }

  async remove(id: number): Promise<void> {
    const result = await this.proveedorRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Proveedor con ID ${id} no encontrado`);
    }
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductoProveedor } from '../producto-proveedor.entity/producto-proveedor.entity';
import { ProductoProveedorRepository } from '../repository/producto-proveedor.repository';
import { CreateProductoProveedorDto } from '../dto/create-producto-proveedor.dto';
import { UpdateProductoProveedorDto } from '../dto/update-producto-proveedor.dto';
import { ProductoRepository } from '../repository/producto.repository';
import { ProveedorRepository } from '../../proveedor/repository/proveedor.repository';

@Injectable()
export class ProductoProveedorService {
  constructor(
    @InjectRepository(ProductoProveedor)
    private readonly repo: ProductoProveedorRepository,
    @InjectRepository(ProductoRepository)
    private readonly productoRepo: ProductoRepository,
    @InjectRepository(ProveedorRepository)
    private readonly proveedorRepo: ProveedorRepository
  ) {}

  async create(dto: CreateProductoProveedorDto): Promise<ProductoProveedor> {
    const producto = await this.productoRepo.findOne({
      where: { id: dto.productoId },
    });
    if (!producto) throw new NotFoundException('Producto not found');

    const proveedor = await this.proveedorRepo.findOne({
      where: { id: dto.proveedorId },
    });
    if (!proveedor) throw new NotFoundException('Proveedor not found');

    const pp = this.repo.create({
      producto,
      proveedor,
      marca: dto.marca ?? null,
      codigoBarras: dto.codigoBarras ?? null,
      precioUnitario: dto.precioUnitario ?? null,
    } as any);
    return this.repo.save(pp);
  }

  async findAll(): Promise<ProductoProveedor[]> {
    return this.repo.find({ relations: ['producto', 'proveedor'] });
  }

  async findOne(id: string): Promise<ProductoProveedor> {
    const item = await this.repo.findOne({
      where: { id },
      relations: ['producto', 'proveedor'],
    });
    if (!item)
      throw new NotFoundException(`ProductoProveedor with id ${id} not found`);
    return item;
  }

  async update(
    id: string,
    dto: UpdateProductoProveedorDto
  ): Promise<ProductoProveedor> {
    const item = await this.findOne(id);

    if ((dto as any).productoId) {
      const producto = await this.productoRepo.findOne({
        where: { id: (dto as any).productoId },
      });
      if (!producto) throw new NotFoundException('Producto not found');
      (item as any).producto = producto;
    }

    if ((dto as any).proveedorId) {
      const proveedor = await this.proveedorRepo.findOne({
        where: { id: (dto as any).proveedorId },
      });
      if (!proveedor) throw new NotFoundException('Proveedor not found');
      (item as any).proveedor = proveedor;
    }

    this.repo.merge(item, dto as any);
    return this.repo.save(item);
  }

  async remove(id: string): Promise<void> {
    const res = await this.repo.delete(id);
    if (res.affected === 0)
      throw new NotFoundException(`ProductoProveedor with id ${id} not found`);
  }
}

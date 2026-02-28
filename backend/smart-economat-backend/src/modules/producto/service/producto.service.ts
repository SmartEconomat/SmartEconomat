import { Injectable, NotFoundException } from '@nestjs/common';
import { Producto } from '../producto.entity/producto.entity';
import { ProductoRepository } from '../repository/producto.repository';
import { CreateProductoDto } from '../dto/create-producto.dto';
import { UpdateProductoDto } from '../dto/update-producto.dto';
import { I18nHelper } from '../../../common/helpers/i18n.helper';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductoProveedor } from '../producto-proveedor.entity/producto-proveedor.entity';

@Injectable()
export class ProductoService {
  constructor(
    private readonly productoRepository: ProductoRepository,
    @InjectRepository(ProductoProveedor)
    private readonly productoProveedorRepository: Repository<ProductoProveedor>
  ) {}

  async create(createProductoDto: CreateProductoDto): Promise<Producto> {
    const { alergenos, proveedores, ...rest } = createProductoDto;
    const producto = this.productoRepository.create(rest);

    if (alergenos && alergenos.length > 0) {
      producto.alergenos = alergenos.map((a) => ({
        alergeno: a,
      })) as any;
    }

    const savedProduct = await this.productoRepository.save(producto);

    if (proveedores && proveedores.length > 0) {
      await this.syncProveedores(savedProduct.id, proveedores);
    }

    return this.findOne(savedProduct.id);
  }

  async findAll(): Promise<Producto[]> {
    return this.productoRepository.find({
      relations: ['proveedores', 'proveedores.proveedor', 'alergenos'],
    });
  }

  async findOne(id: string): Promise<Producto> {
    const producto = await this.productoRepository.findOne({
      where: { id },
      relations: ['proveedores', 'proveedores.proveedor', 'alergenos'],
    });
    if (!producto) {
      throw new NotFoundException(I18nHelper.getError('PRODUCT_NOT_FOUND'));
    }
    return producto;
  }

  async update(
    id: string,
    updateProductoDto: UpdateProductoDto
  ): Promise<Producto> {
    const { alergenos, proveedores, ...rest } = updateProductoDto;
    const producto = await this.findOne(id);

    this.productoRepository.merge(producto, rest);

    if (alergenos) {
      producto.alergenos = alergenos.map((a) => ({
        alergeno: a,
        idProducto: id,
      })) as any;
    }

    await this.productoRepository.save(producto);

    if (proveedores !== undefined) {
      await this.syncProveedores(id, proveedores);
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const result = await this.productoRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(I18nHelper.getError('PRODUCT_NOT_FOUND'));
    }
  }

  private async syncProveedores(
    productoId: string,
    proveedores: import('../dto/producto-proveedor.dto/producto-proveedor.dto').ProductoProveedorDto[]
  ) {
    const existing = await this.productoProveedorRepository.find({
      where: { producto: { id: productoId } },
      relations: ['proveedor'],
    });

    const existingIds = existing.map((ep) => ep.proveedor.id);
    const newProveedores = proveedores.filter(
      (p) => !existingIds.includes(p.proveedorId)
    );
    const proveedoresToUpdate = proveedores.filter((p) =>
      existingIds.includes(p.proveedorId)
    );

    if (newProveedores.length > 0) {
      const newRelations = newProveedores.map((p) =>
        this.productoProveedorRepository.create({
          producto: { id: productoId } as any,
          proveedor: { id: p.proveedorId } as any,
          precioUnitario: p.precioUnitario ?? 0,
          marca: p.marca,
          codigoBarras: p.codigoBarras,
        })
      );
      await this.productoProveedorRepository.save(newRelations);
    }

    if (proveedoresToUpdate.length > 0) {
      for (const p of proveedoresToUpdate) {
        const toUpdate = existing.find((e) => e.proveedor.id === p.proveedorId);
        if (toUpdate) {
          toUpdate.precioUnitario = p.precioUnitario ?? toUpdate.precioUnitario;
          toUpdate.marca = p.marca ?? toUpdate.marca;
          toUpdate.codigoBarras = p.codigoBarras ?? toUpdate.codigoBarras;
          await this.productoProveedorRepository.save(toUpdate);
        }
      }
    }

    const currentProviderIds = proveedores.map((p) => p.proveedorId);
    const idsToRemove = existingIds.filter(
      (id) => !currentProviderIds.includes(id)
    );

    if (idsToRemove.length > 0) {
      for (const id of idsToRemove) {
        const toDelete = existing.find((e) => e.proveedor.id === id);
        if (toDelete) {
          await this.productoProveedorRepository.softDelete(toDelete.id);
        }
      }
    }
  }
}

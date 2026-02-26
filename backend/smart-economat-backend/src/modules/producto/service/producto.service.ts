import { Injectable, NotFoundException } from '@nestjs/common';
import { Producto } from '../producto.entity/producto.entity';
import { ProductoRepository } from '../repository/producto.repository';
import { CreateProductoDto } from '../dto/create-producto.dto';
import { UpdateProductoDto } from '../dto/update-producto.dto';
import { I18nHelper } from '../../../common/helpers/i18n.helper';

@Injectable()
export class ProductoService {
  constructor(private readonly productoRepository: ProductoRepository) {}

  async create(createProductoDto: CreateProductoDto): Promise<Producto> {
    const { alergenos, ...rest } = createProductoDto;
    const producto = this.productoRepository.create(rest);

    if (alergenos && alergenos.length > 0) {
      producto.alergenos = alergenos.map((a) => ({
        alergeno: a,
      })) as any;
    }

    return this.productoRepository.save(producto);
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
    const { alergenos, ...rest } = updateProductoDto;
    const producto = await this.findOne(id);

    this.productoRepository.merge(producto, rest);

    if (alergenos) {
      producto.alergenos = alergenos.map((a) => ({
        alergeno: a,
        idProducto: id,
      })) as any;
    }

    await this.productoRepository.save(producto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const result = await this.productoRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(I18nHelper.getError('PRODUCT_NOT_FOUND'));
    }
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Producto } from '../producto.entity/producto.entity';
import { ProductoRepository } from '../repository/producto.repository';
import { CreateProductoDto } from '../dto/create-producto.dto';
import { UpdateProductoDto } from '../dto/update-producto.dto';
import { getProductMessage } from '../constants';
import { ErrorMessages } from '../../../common/enums/messages/errors/error-messages.enum';
import { LanguageEnum } from '../../../common/enums/languages/language.enum';
@Injectable()
export class ProductosService {
  constructor(
    @InjectRepository(Producto)
    private readonly productoRepository: ProductoRepository
  ) {}

  async create(createProductoDto: CreateProductoDto): Promise<Producto> {
    const producto = this.productoRepository.create(createProductoDto);
    return this.productoRepository.save(producto);
  }

  async findAll(): Promise<Producto[]> {
    return this.productoRepository.find();
  }

  async findOne(id: string): Promise<Producto> {
    const producto = await this.productoRepository.findOne({ where: { id } });
    if (!producto) {
      throw new NotFoundException(
        getProductMessage(ErrorMessages.NOT_FOUND, LanguageEnum.ES, id)
      );
    }
    return producto;
  }

  async update(
    id: string,
    updateProductoDto: UpdateProductoDto
  ): Promise<Producto> {
    const producto = await this.findOne(id);
    this.productoRepository.merge(producto, updateProductoDto);
    return this.productoRepository.save(producto);
  }

  async remove(id: string): Promise<void> {
    const result = await this.productoRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(
        getProductMessage(ErrorMessages.NOT_FOUND, LanguageEnum.ES, id)
      );
    }
  }
}

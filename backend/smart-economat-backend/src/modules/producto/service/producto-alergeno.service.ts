import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductoAlergeno } from '../producto-alergeno.entity/producto-alergeno.entity';
import { Producto } from '../producto.entity/producto.entity';
import { CreateProductoAlergenoDto } from '../dto/producto-alergeno.dto/create-producto-alergeno.dto';
import { UpdateProductoAlergenoDto } from '../dto/producto-alergeno.dto/update-producto-alergeno.dto';
import { I18nHelper } from '../../../common/helpers/i18n.helper';
import { Alergeno } from '../enums/producto.enums';

@Injectable()
export class ProductoAlergenoService {
  constructor(
    @InjectRepository(ProductoAlergeno)
    private readonly productoAlergenoRepository: Repository<ProductoAlergeno>,
    @InjectRepository(Producto)
    private readonly productoRepository: Repository<Producto>
  ) {}

  /**
   * Crea una nueva asociación entre un Producto y un Alérgeno.
   * Verifica que el producto exista y que la asociación no esté duplicada.
   */
  async create(dto: CreateProductoAlergenoDto): Promise<ProductoAlergeno> {
    const { idProducto, alergeno } = dto;

    const producto = await this.productoRepository.findOne({
      where: { id: idProducto },
    });
    if (!producto) {
      throw new NotFoundException(I18nHelper.getError('PRODUCT_NOT_FOUND'));
    }

    const existing = await this.productoAlergenoRepository.findOne({
      where: { idProducto, alergeno },
    });
    if (existing) {
      throw new ConflictException(
        I18nHelper.getError('PRODUCTO_ALERGENO_ALREADY_EXISTS')
      );
    }

    const productoAlergeno = this.productoAlergenoRepository.create({
      idProducto,
      alergeno,
      producto,
    });

    return this.productoAlergenoRepository.save(productoAlergeno);
  }

  /**
   * Devuelve todas las asociaciones producto-alérgeno.
   * Si se pasa idProducto como query param, filtra por ese producto.
   */
  async findAll(idProducto?: string): Promise<ProductoAlergeno[]> {
    const qb = this.productoAlergenoRepository
      .createQueryBuilder('pa')
      .leftJoinAndSelect('pa.producto', 'producto');

    if (idProducto) {
      qb.where('pa.idProducto = :idProducto', { idProducto });
    }

    return qb.getMany();
  }

  /**
   * Devuelve todos los alérgenos asociados a un producto concreto.
   * Lanza NotFoundException si el producto no existe.
   */
  async findOne(idProducto: string): Promise<ProductoAlergeno[]> {
    const productoExiste = await this.productoRepository.findOne({
      where: { id: idProducto },
    });
    if (!productoExiste) {
      throw new NotFoundException(I18nHelper.getError('PRODUCT_NOT_FOUND'));
    }

    return this.productoAlergenoRepository.find({
      where: { idProducto },
      relations: ['producto'],
    });
  }

  /**
   * Reemplaza completamente el conjunto de alérgenos de un producto.
   * Elimina (hard delete) las asociaciones existentes y crea las nuevas.
   * Se usa hard delete porque la PK compuesta impide recrear registros con soft delete.
   */
  async update(
    idProducto: string,
    dto: UpdateProductoAlergenoDto
  ): Promise<ProductoAlergeno[]> {
    const producto = await this.productoRepository.findOne({
      where: { id: idProducto },
    });
    if (!producto) {
      throw new NotFoundException(I18nHelper.getError('PRODUCT_NOT_FOUND'));
    }

    await this.productoAlergenoRepository
      .createQueryBuilder()
      .delete()
      .from(ProductoAlergeno)
      .where('id_producto = :idProducto', { idProducto })
      .execute();

    const uniqueAlergenos = [...new Set(dto.alergenos)];
    const newRelations = uniqueAlergenos.map((alergeno) =>
      this.productoAlergenoRepository.create({
        idProducto,
        alergeno,
        producto,
      })
    );

    return this.productoAlergenoRepository.save(newRelations);
  }

  /**
   * Elimina (hard delete) una asociación concreta producto-alérgeno.
   * Lanza BadRequestException si el valor del alérgeno no pertenece al enum.
   * Lanza NotFoundException si la asociación no existe.
   */
  async remove(idProducto: string, alergeno: string): Promise<void> {
    if (!Object.values(Alergeno).includes(alergeno as Alergeno)) {
      throw new BadRequestException(
        `El alérgeno "${alergeno}" no es un valor válido`
      );
    }

    const productoAlergeno = await this.productoAlergenoRepository.findOne({
      where: { idProducto, alergeno: alergeno as Alergeno },
    });
    if (!productoAlergeno) {
      throw new NotFoundException(
        I18nHelper.getError('PRODUCTO_ALERGENO_NOT_FOUND')
      );
    }

    await this.productoAlergenoRepository
      .createQueryBuilder()
      .delete()
      .from(ProductoAlergeno)
      .where('id_producto = :idProducto AND alergeno = :alergeno', {
        idProducto,
        alergeno,
      })
      .execute();
  }
}

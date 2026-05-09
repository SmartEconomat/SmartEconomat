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

/**
 * Servicio de dominio para producto alergeno.
 */
@Injectable()
export class ProductoAlergenoService {
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  constructor(
    @InjectRepository(ProductoAlergeno)
    private readonly productoAlergenoRepository: Repository<ProductoAlergeno>,
    @InjectRepository(Producto)
    private readonly productoRepository: Repository<Producto>
  ) {}

  /**
   * Crea create.
   *
   * @param dto Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
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
      where: { productoId: idProducto, alergeno },
    });
    if (existing) {
      throw new ConflictException(
        I18nHelper.getError('PRODUCTO_ALERGENO_ALREADY_EXISTS')
      );
    }

    const productoAlergeno = this.productoAlergenoRepository.create({
      productoId: idProducto,
      alergeno,
      producto,
    });

    return this.productoAlergenoRepository.save(productoAlergeno);
  }

  /**
   * Busca all.
   *
   * @param idProducto Parámetro de entrada para la operación. Opcional.
   * @returns Valor resultante de la operación.
   */
  async findAll(idProducto?: string): Promise<ProductoAlergeno[]> {
    const qb = this.productoAlergenoRepository
      .createQueryBuilder('pa')
      .leftJoinAndSelect('pa.producto', 'producto');

    if (idProducto) {
      qb.where('pa.productoId = :idProducto', { idProducto });
    }

    return qb.getMany();
  }

  /**
   * Busca one.
   *
   * @param idProducto Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
   */
  async findOne(idProducto: string): Promise<ProductoAlergeno[]> {
    const productoExiste = await this.productoRepository.findOne({
      where: { id: idProducto },
    });
    if (!productoExiste) {
      throw new NotFoundException(I18nHelper.getError('PRODUCT_NOT_FOUND'));
    }

    return this.productoAlergenoRepository.find({
      where: { productoId: idProducto },
      relations: ['producto'],
    });
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Persiste modificaciones válidas sobre entidades existentes.
   * @undefined {string} idProducto - Entrada efectiva esperada por el contrato.
   * @undefined {UpdateProductoAlergenoDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<ProductoAlergeno[]>} Datos efectivos después de ejecutar la operación.
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
      .where('producto_id = :idProducto', { idProducto })
      .execute();

    const uniqueAlergenos = [...new Set(dto.alergenos)];
    const newRelations = uniqueAlergenos.map((alergeno) =>
      this.productoAlergenoRepository.create({
        productoId: idProducto,
        alergeno,
        producto,
      })
    );

    return this.productoAlergenoRepository.save(newRelations);
  }

  /**
   * Elimina remove.
   *
   * @param idProducto Parámetro de entrada para la operación.
   * @param alergeno Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
   */
  async remove(idProducto: string, alergeno: string): Promise<void> {
    if (!Object.values(Alergeno).includes(alergeno as Alergeno)) {
      throw new BadRequestException(
        `El alérgeno "${alergeno}" no es un valor válido`
      );
    }

    const productoAlergeno = await this.productoAlergenoRepository.findOne({
      where: { productoId: idProducto, alergeno: alergeno as Alergeno },
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
      .where('producto_id = :idProducto AND alergeno = :alergeno', {
        idProducto,
        alergeno,
      })
      .execute();
  }
}

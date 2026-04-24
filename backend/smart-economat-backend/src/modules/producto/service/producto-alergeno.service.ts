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
 * @description Service layer for managing allergen associations on products (ProductoAlergeno).
 * Supports creating, listing, replacing, and hard-deleting product–allergen links.
 */
@Injectable()
export class ProductoAlergenoService {
  /**
   * @description Constructs the service with the required TypeORM repositories.
   * @param productoAlergenoRepository - Repository for ProductoAlergeno join entities.
   * @param productoRepository - Repository for Producto entities, used for existence checks.
   */
  constructor(
    @InjectRepository(ProductoAlergeno)
    private readonly productoAlergenoRepository: Repository<ProductoAlergeno>,
    @InjectRepository(Producto)
    private readonly productoRepository: Repository<Producto>
  ) {}

  /**
   * @description Crea un nuevo association between a Producto and an Alérgeno.
   * Valida that the product exists and that the association is not already registered.
   * @param dto - DTO containing the product ID and allergen value.
   * @returns La entidad recién creada ProductoAlergeno entity.
   * @throws {NotFoundException} If the referenced Producto does not exist.
   * @throws {ConflictException} If the product–allergen association already exists.
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
   * @description Devuelve todos los product–allergen associations, opcionalmente filtrados por producto.
   * When `idProducto` is provided the result is scoped to that product; otherwise all records
   * are returned. The `producto` relation is always joined.
   * @param idProducto - Optional product UUID to filter results by.
   * @returns Array of ProductoAlergeno entities (may be empty).
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
   * @description Devuelve todos los allergen associations for a specific product.
   * Valida that the product exists before querying its allergens.
   * @param idProducto - UUID of the product whose allergens should be returned.
   * @returns Array of ProductoAlergeno entities for the given product.
   * @throws {NotFoundException} If the referenced Producto does not exist.
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
   * @description Replaces the full set of allergens for a product.
   * All existing product–allergen associations are hard-deleted and then recreated
   * from the deduplicated list in the DTO. Hard delete is required because the
   * composite primary key prevents soft-deleted records from being recreated.
   * @param idProducto - UUID of the product whose allergens should be replaced.
   * @param dto - DTO containing the new list of allergen values.
   * @returns Array of the newly created ProductoAlergeno entities.
   * @throws {NotFoundException} If the referenced Producto does not exist.
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
   * @description Hard-deletes a specific product–allergen association.
   * Valida that the allergen string is a member of the `Alergeno` enum before querying.
   * @param idProducto - UUID of the product.
   * @param alergeno - Allergen string value (must be a valid `Alergeno` enum member).
   * @returns Resuelve with void on success.
   * @throws {BadRequestException} If the allergen value is not a valid enum member.
   * @throws {NotFoundException} If the product–allergen association does not exist.
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

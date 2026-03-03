import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, ILike, In, Repository } from 'typeorm';
import { Receta } from '../receta.entity/receta.entity';
import { RecetaIngrediente } from '../receta-ingrediente.entity/receta-ingrediente.entity';
import { Producto } from '../../producto/producto.entity/producto.entity';
import { CreateRecetaDto } from '../dto/create-receta.dto';
import { UpdateRecetaDto } from '../dto/update-receta.dto';
import { I18nHelper } from '../../../common/helpers/i18n.helper';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';

const INGREDIENTES_RELATIONS = [
  'ingredientes',
  'ingredientes.producto',
  'ingredientes.producto.alergenos',
] as const;

@Injectable()
export class RecetaRepository {
  constructor(
    @InjectRepository(Receta)
    private readonly recetaRepo: Repository<Receta>,

    private readonly dataSource: DataSource
  ) {}

  async create(dto: CreateRecetaDto): Promise<Receta> {
    return this.dataSource.transaction(async (manager) => {
      const productoIds = dto.ingredientes.map((ing) => ing.productoId);

      if (new Set(productoIds).size !== productoIds.length) {
        throw new BadRequestException(
          I18nHelper.getError('DUPLICATE_INGREDIENT')
        );
      }

      // Un solo query para todos los productos (evita N+1)
      const productos = await manager.find(Producto, {
        where: { id: In(productoIds) },
      });
      const productosMap = new Map(productos.map((p) => [p.id, p]));

      const missingId = productoIds.find((id) => !productosMap.has(id));
      if (missingId) {
        throw new BadRequestException(I18nHelper.getError('PRODUCT_NOT_FOUND'));
      }

      const receta = manager.create(Receta, {
        nombre: dto.nombre,
        instrucciones: dto.instrucciones,
        tiempo: dto.tiempo,
        dificultad: dto.dificultad,
        tiempoPreparacion: dto.tiempoPreparacion,
      });

      await manager.save(receta);

      // Batch save de todos los ingredientes en una sola operación
      const ingredientes = dto.ingredientes.map((ing) =>
        manager.create(RecetaIngrediente, {
          cantidad: ing.cantidad,
          unidad: ing.unidad,
          receta,
          producto: productosMap.get(ing.productoId),
        })
      );
      await manager.save(ingredientes);

      const saved = await manager.findOne(Receta, {
        where: { id: receta.id },
        relations: [...INGREDIENTES_RELATIONS],
      });

      if (!saved) {
        throw new NotFoundException(I18nHelper.getError('RECIPE_NOT_FOUND'));
      }

      return saved;
    });
  }

  async findAllPaginated(
    query: PaginationQueryDto
  ): Promise<PaginatedResponseDto<Receta>> {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);

    const whereCondition = query.searchTerm
      ? [
          { nombre: ILike(`%${query.searchTerm}%`) },
          { instrucciones: ILike(`%${query.searchTerm}%`) },
        ]
      : {};

    const [data, total] = await this.recetaRepo.findAndCount({
      where: whereCondition,
      relations: [...INGREDIENTES_RELATIONS],
      order: { nombre: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findById(id: string): Promise<Receta | null> {
    return this.recetaRepo.findOne({
      where: { id },
      relations: [...INGREDIENTES_RELATIONS],
    });
  }

  async update(id: string, dto: UpdateRecetaDto): Promise<Receta> {
    // El servicio ya verificó existencia con findOne — no se repite aquí
    return this.dataSource.transaction(async (manager) => {
      if (dto.ingredientes) {
        const productoIds = dto.ingredientes.map((ing) => ing.productoId);

        if (new Set(productoIds).size !== productoIds.length) {
          throw new BadRequestException(
            I18nHelper.getError('DUPLICATE_INGREDIENT')
          );
        }

        // Un solo query para todos los productos (evita N+1)
        const productos = await manager.find(Producto, {
          where: { id: In(productoIds) },
        });
        const productosMap = new Map(productos.map((p) => [p.id, p]));

        const missingId = productoIds.find((pid) => !productosMap.has(pid));
        if (missingId) {
          throw new BadRequestException(
            I18nHelper.getError('PRODUCT_NOT_FOUND')
          );
        }

        await manager.delete(RecetaIngrediente, { receta: { id } });

        // Batch save de todos los ingredientes en una sola operación
        const ingredientes = dto.ingredientes.map((ing) =>
          manager.create(RecetaIngrediente, {
            cantidad: ing.cantidad,
            unidad: ing.unidad,
            receta: { id } as Receta,
            producto: productosMap.get(ing.productoId),
          })
        );
        await manager.save(ingredientes);
      }

      const updateData: Partial<Receta> = {
        ...(dto.nombre !== undefined && { nombre: dto.nombre }),
        ...(dto.instrucciones !== undefined && {
          instrucciones: dto.instrucciones,
        }),
        ...(dto.tiempo !== undefined && { tiempo: dto.tiempo }),
        ...(dto.dificultad !== undefined && { dificultad: dto.dificultad }),
        ...(dto.tiempoPreparacion !== undefined && {
          tiempoPreparacion: dto.tiempoPreparacion,
        }),
      };

      // Solo ejecuta el UPDATE si hay campos escalares que actualizar
      if (Object.keys(updateData).length > 0) {
        await manager.update(Receta, id, updateData);
      }

      const updated = await manager.findOne(Receta, {
        where: { id },
        relations: [...INGREDIENTES_RELATIONS],
      });

      if (!updated) {
        throw new NotFoundException(I18nHelper.getError('RECIPE_NOT_FOUND'));
      }

      return updated;
    });
  }

  async remove(id: string): Promise<void> {
    const result = await this.recetaRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(I18nHelper.getError('RECIPE_NOT_FOUND'));
    }
  }

  async duplicate(sourceId: string, newName: string): Promise<Receta> {
    const sourceReceta = await this.findById(sourceId);

    if (!sourceReceta) {
      throw new NotFoundException(I18nHelper.getError('RECIPE_NOT_FOUND'));
    }

    return this.dataSource.transaction(async (manager) => {
      const newReceta = manager.create(Receta, {
        nombre: newName,
        instrucciones: sourceReceta.instrucciones,
        tiempo: sourceReceta.tiempo,
        dificultad: sourceReceta.dificultad,
        tiempoPreparacion: sourceReceta.tiempoPreparacion,
      });

      await manager.save(newReceta);

      if (sourceReceta.ingredientes?.length) {
        // Batch save de todos los ingredientes en una sola operación
        const ingredientes = sourceReceta.ingredientes.map((ing) =>
          manager.create(RecetaIngrediente, {
            cantidad: ing.cantidad,
            unidad: ing.unidad,
            receta: newReceta,
            producto: ing.producto,
          })
        );
        await manager.save(ingredientes);
      }

      const saved = await manager.findOne(Receta, {
        where: { id: newReceta.id },
        relations: [...INGREDIENTES_RELATIONS],
      });

      if (!saved) {
        throw new NotFoundException(I18nHelper.getError('RECIPE_NOT_FOUND'));
      }

      return saved;
    });
  }
}

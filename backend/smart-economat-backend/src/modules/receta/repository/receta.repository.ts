import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Receta } from '../receta.entity/receta.entity';
import { RecetaIngrediente } from '../receta-ingrediente.entity/receta-ingrediente.entity';
import { Producto } from '../../producto/producto.entity/producto.entity';
import { CreateRecetaDto } from '../dto/create-receta.dto';
import { UpdateRecetaDto } from '../dto/update-receta.dto';
import { I18nHelper } from '../../../common/helpers/i18n.helper';

@Injectable()
export class RecetaRepository {
  constructor(
    @InjectRepository(Receta)
    private readonly recetaRepo: Repository<Receta>,

    @InjectRepository(RecetaIngrediente)
    private readonly recetaIngredienteRepo: Repository<RecetaIngrediente>,

    @InjectRepository(Producto)
    private readonly productoRepo: Repository<Producto>,

    private readonly dataSource: DataSource
  ) {}

  async create(dto: CreateRecetaDto): Promise<Receta> {
    return this.dataSource.transaction(async (manager) => {
      const receta = manager.create(Receta, {
        nombre: dto.nombre,
        instrucciones: dto.instrucciones,
        tiempo: dto.tiempo,
        dificultad: dto.dificultad,
        tiempoPreparacion: dto.tiempoPreparacion,
      });

      await manager.save(receta);

      for (const ing of dto.ingredientes) {
        const producto = await manager.findOne(Producto, {
          where: { id: ing.productoId },
        });

        if (!producto) {
          throw new BadRequestException(
            I18nHelper.getError('PRODUCT_NOT_FOUND')
          );
        }

        const recetaIngrediente = manager.create(RecetaIngrediente, {
          cantidad: ing.cantidad,
          unidad: ing.unidad,
          receta,
          producto,
        });

        await manager.save(recetaIngrediente);
      }

      return manager.findOneOrFail(Receta, {
        where: { id: receta.id },
        relations: [
          'ingredientes',
          'ingredientes.producto',
          'ingredientes.producto.alergenos',
        ],
      });
    });
  }

  async findAll(): Promise<Receta[]> {
    return this.recetaRepo.find({
      relations: [
        'ingredientes',
        'ingredientes.producto',
        'ingredientes.producto.alergenos',
      ],
    });
  }

  async findById(id: string): Promise<Receta | null> {
    return this.recetaRepo.findOne({
      where: { id },
      relations: [
        'ingredientes',
        'ingredientes.producto',
        'ingredientes.producto.alergenos',
      ],
    });
  }

  async update(id: string, dto: UpdateRecetaDto): Promise<Receta> {
    const receta = await this.findById(id);

    if (!receta) {
      throw new NotFoundException(I18nHelper.getError('RECIPE_NOT_FOUND'));
    }

    return this.dataSource.transaction(async (manager) => {
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

      await manager.update(Receta, id, updateData);

      if (dto.ingredientes) {
        await manager.delete(RecetaIngrediente, { receta: { id } });

        for (const ing of dto.ingredientes) {
          const producto = await manager.findOne(Producto, {
            where: { id: ing.productoId },
          });

          if (!producto) {
            throw new BadRequestException(
              I18nHelper.getError('PRODUCT_NOT_FOUND')
            );
          }

          const recetaIngrediente = manager.create(RecetaIngrediente, {
            cantidad: ing.cantidad,
            unidad: ing.unidad,
            receta: { id } as Receta,
            producto,
          });

          await manager.save(recetaIngrediente);
        }
      }

      return manager.findOneOrFail(Receta, {
        where: { id },
        relations: [
          'ingredientes',
          'ingredientes.producto',
          'ingredientes.producto.alergenos',
        ],
      });
    });
  }

  async remove(id: string): Promise<void> {
    const result = await this.recetaRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(I18nHelper.getError('RECIPE_NOT_FOUND'));
    }
  }
}

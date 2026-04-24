import { UseCase } from '../../../common/ddd/use-case';
import { RepositoryInterface } from '../../../common/ddd/repository.interface';

export type CreateProductInput = {
  nombre: string;
  descripcion?: string;
  marca?: string;
  unidad?: string;
  contenido?: number;
  tipo?: string;
  codigoBarras?: string;
};

export type ProductOutput = {
  id: string;
  nombre: string;
  codigoBarras?: string;
};

/**
 * Use case that encapsulates the business logic for creating a new product.
 * Validates the product name, delegates persistence to the repository, and
 * returns a minimal output object. This class serves as a reference example
 * for incremental migration to the DDD application layer.
 *
 * @class CreateProductUseCase
 * @implements {UseCase<CreateProductInput, ProductOutput>}
 */
export class CreateProductUseCase implements UseCase<
  CreateProductInput,
  ProductOutput
> {
  constructor(private readonly productoRepo: RepositoryInterface<any>) {}

  async execute(input: CreateProductInput): Promise<ProductOutput> {
    if (!input.nombre || input.nombre.trim().length === 0) {
      throw new Error('El nombre es obligatorio');
    }

    const toSave = {
      ...input,
    };

    const saved = await this.productoRepo.save(toSave as any);

    return {
      id: saved.id,
      nombre: saved.nombre,
      codigoBarras: saved.codigoBarras,
    };
  }
}

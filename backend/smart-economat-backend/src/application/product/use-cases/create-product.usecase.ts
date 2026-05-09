import { UseCase } from '../../../common/ddd/use-case';
import { RepositoryInterface } from '../../../common/ddd/repository.interface';
import { BadRequestException } from '@nestjs/common';
import { I18nHelper } from '../../../common/helpers/i18n.helper';

/** Alias público (CreateProductInput) para simplificar payloads o props en smart-economat-backend (Nest). */
export type CreateProductInput = {
  nombre: string;
  descripcion?: string;
  marca?: string;
  unidad?: string;
  contenido?: number;
  tipo?: string;
  codigoBarras?: string;
};

/** Alias público (ProductOutput) para simplificar payloads o props en smart-economat-backend (Nest). */
export type ProductOutput = {
  id: string;
  nombre: string;
  codigoBarras?: string;
};

/**
 * Representa create product use case en el sistema.
 */
export class CreateProductUseCase implements UseCase<
  CreateProductInput,
  ProductOutput
> {
  /**
   * Construye la instancia configurada.
   * @undefined {RepositoryInterface<any, string>} productoRepo - Entrada efectiva esperada por el contrato.
   */
  constructor(private readonly productoRepo: RepositoryInterface<any>) {}

  /**
   * Expone "execute" en smart-economat-backend (Nest).
   * @undefined {CreateProductInput} input - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<ProductOutput>} Datos efectivos después de ejecutar la operación.
   */
  async execute(input: CreateProductInput): Promise<ProductOutput> {
    if (!input.nombre || input.nombre.trim().length === 0) {
      throw new BadRequestException(
        I18nHelper.getError('PRODUCT_NAME_REQUIRED')
      );
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

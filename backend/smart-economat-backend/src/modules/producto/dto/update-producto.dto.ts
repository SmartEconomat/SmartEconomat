import { PartialType } from '@nestjs/mapped-types';
import { CreateProductoDto } from './create-producto.dto';

/** Clase pública (UpdateProductoDto). Paquete: smart-economat-backend (Nest). */
export class UpdateProductoDto extends PartialType(CreateProductoDto) {}

import { PartialType } from '@nestjs/mapped-types';
import { CreateRecepcionProductoDto } from './create-recepcion-producto.dto';

/** Clase pública (UpdateRecepcionProductoDto). Paquete: smart-economat-backend (Nest). */
export class UpdateRecepcionProductoDto extends PartialType(
  CreateRecepcionProductoDto
) {}

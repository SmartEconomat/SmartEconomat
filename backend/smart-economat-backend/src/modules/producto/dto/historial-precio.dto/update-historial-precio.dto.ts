import { PartialType } from '@nestjs/mapped-types';
import { CreateHistorialPrecioDto } from './create-historial-precio.dto';

/** Clase pública (UpdateHistorialPrecioDto). Paquete: smart-economat-backend (Nest). */
export class UpdateHistorialPrecioDto extends PartialType(
  CreateHistorialPrecioDto
) {}

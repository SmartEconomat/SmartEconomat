import { PartialType } from '@nestjs/mapped-types';
import { CreateMovimientoDto } from './create-movimiento.dto';

/** Clase pública (UpdateMovimientoDto). Paquete: smart-economat-backend (Nest). */
export class UpdateMovimientoDto extends PartialType(CreateMovimientoDto) {}

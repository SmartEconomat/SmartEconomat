import { PartialType } from '@nestjs/mapped-types';
import { CreateRecepcionDto } from './create-recepcion.dto';

/** Clase pública (UpdateRecepcionDto). Paquete: smart-economat-backend (Nest). */
export class UpdateRecepcionDto extends PartialType(CreateRecepcionDto) {}

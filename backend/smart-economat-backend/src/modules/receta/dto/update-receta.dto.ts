import { PartialType } from '@nestjs/mapped-types';
import { CreateRecetaDto } from './create-receta.dto';

/** Clase pública (UpdateRecetaDto). Paquete: smart-economat-backend (Nest). */
export class UpdateRecetaDto extends PartialType(CreateRecetaDto) {}

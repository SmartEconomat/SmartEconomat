import { PartialType } from '@nestjs/mapped-types';
import { CreateAlbaranDto } from './create-albaran.dto';

/** Clase pública (UpdateAlbaranDto). Paquete: smart-economat-backend (Nest). */
export class UpdateAlbaranDto extends PartialType(CreateAlbaranDto) {}

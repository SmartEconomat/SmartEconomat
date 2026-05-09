import { PartialType } from '@nestjs/swagger';
import { CreateRolDto } from './create-rol.dto';

/** Clase pública (UpdateRolDto). Paquete: smart-economat-backend (Nest). */
export class UpdateRolDto extends PartialType(CreateRolDto) {}

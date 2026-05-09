import { PartialType } from '@nestjs/swagger';
import { CreatePermisoDto } from './create-permiso.dto';

/** Clase pública (UpdatePermisoDto). Paquete: smart-economat-backend (Nest). */
export class UpdatePermisoDto extends PartialType(CreatePermisoDto) {}

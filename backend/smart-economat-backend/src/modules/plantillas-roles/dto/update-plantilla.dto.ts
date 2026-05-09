import { PartialType } from '@nestjs/swagger';
import { CreatePlantillaDto } from './create-plantilla.dto';

/** Clase pública (UpdatePlantillaDto). Paquete: smart-economat-backend (Nest). */
export class UpdatePlantillaDto extends PartialType(CreatePlantillaDto) {}

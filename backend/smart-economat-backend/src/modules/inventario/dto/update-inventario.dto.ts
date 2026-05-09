import { PartialType } from '@nestjs/mapped-types';
import { CreateInventarioItemDto } from './create-InventarioItem.dto';

/** Clase pública (UpdateInventarioDto). Paquete: smart-economat-backend (Nest). */
export class UpdateInventarioDto extends PartialType(CreateInventarioItemDto) {}

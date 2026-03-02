import { PartialType } from '@nestjs/mapped-types';
import { CreateHistorialPrecioDto } from './create-historial-precio.dto';

export class UpdateHistorialPrecioDto extends PartialType(
  CreateHistorialPrecioDto
) {}

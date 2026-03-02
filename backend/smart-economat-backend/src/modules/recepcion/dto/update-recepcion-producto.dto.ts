import { PartialType } from '@nestjs/mapped-types';
import { CreateRecepcionProductoDto } from './create-recepcion-producto.dto';

export class UpdateRecepcionProductoDto extends PartialType(
  CreateRecepcionProductoDto
) {}

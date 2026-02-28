import { PartialType } from '@nestjs/mapped-types';
import { CreateInventarioItemDto } from './create-InventarioItem.dto';

export class UpdateInventarioDto extends PartialType(CreateInventarioItemDto) {}

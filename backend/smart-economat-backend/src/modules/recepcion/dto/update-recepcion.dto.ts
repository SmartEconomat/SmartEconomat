import { PartialType } from '@nestjs/mapped-types';
import { CreateRecepcionDto } from './create-recepcion.dto';

export class UpdateRecepcionDto extends PartialType(CreateRecepcionDto) {}

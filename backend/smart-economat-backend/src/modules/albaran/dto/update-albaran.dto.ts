import { PartialType } from '@nestjs/mapped-types';
import { CreateAlbaranDto } from './create-albaran.dto';

export class UpdateAlbaranDto extends PartialType(CreateAlbaranDto) {}

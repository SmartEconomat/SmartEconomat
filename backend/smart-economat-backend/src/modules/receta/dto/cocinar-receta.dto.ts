import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { IsPortion } from '../../../common/decorators/is-portion.decorator';

/** Clase pública (CocinarRecetaDto). Paquete: smart-economat-backend (Nest). */
export class CocinarRecetaDto {
  @ApiPropertyOptional({
    description: 'docs.CANTIDAD_DE_PORCIONES_VECES_A_ELABORAR_D',
    default: 1,
  })
  @IsOptional()
  @IsPortion()
  cantidad?: number;
}

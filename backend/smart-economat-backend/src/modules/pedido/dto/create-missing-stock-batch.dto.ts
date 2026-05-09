import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { ValidarProduccionDto } from '../../receta/dto/validar-produccion.dto';

/** Clase pública (CreateMissingStockBatchDto). Paquete: smart-economat-backend (Nest). */
export class CreateMissingStockBatchDto extends ValidarProduccionDto {
  @ApiPropertyOptional({
    description:
      'Observaciones generales para los pedidos generados por faltantes',
    required: false,
  })
  @IsOptional()
  @IsString()
  observaciones?: string;
}

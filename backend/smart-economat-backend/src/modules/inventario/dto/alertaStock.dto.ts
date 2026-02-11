import { IsUUID, IsInt, Min, IsNotEmpty } from 'class-validator';

export class AlertaStockDTO {
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @IsInt()
  @Min(0)
  cantidadMinima: number;

  @IsInt()
  @Min(0)
  cantidadActual: number;
}

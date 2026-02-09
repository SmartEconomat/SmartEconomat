import { 
IsUUID,
IsInt,
Min,
IsNotEmpty,
} from 'class-validator';

export class AlertaStock {

    @IsUUID()
    @IsNotEmpty()
    id: string;

    @IsInt()
    @Min(0)
    cantidad_minima: number;

    @IsInt()
    @Min(0)
    cantidad_actual: number;
}
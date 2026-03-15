import { CreateMovimientoDto } from '../dto/create-movimiento.dto';
import { Movimiento } from '../movimiento.entity/movimiento.entity';

export abstract class MovimientoPort {
  abstract create(dto: CreateMovimientoDto): Promise<Movimiento>;
}

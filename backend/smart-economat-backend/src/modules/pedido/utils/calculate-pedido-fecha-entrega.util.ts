import { ConfigService } from '@nestjs/config';

/**
 * Calcula la fecha de entrega estimada a partir de `PEDIDO_FECHA_ENTREGA_HOURS` (default 48h).
 */
export function calculatePedidoFechaEntrega(
  configService: ConfigService,
  baseDate: Date = new Date()
): Date {
  const hours = configService.get<number>('PEDIDO_FECHA_ENTREGA_HOURS', 48);
  return new Date(baseDate.getTime() + hours * 60 * 60 * 1000);
}

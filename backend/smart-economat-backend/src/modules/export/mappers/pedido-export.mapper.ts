import { Pedido } from '../../pedido/pedido.entity/pedido.entity';
import { ExportColumn } from './producto-export.mapper';

const IVA_RATE = 0.21;

export const PEDIDO_COLUMNS: ExportColumn[] = [
  { header: 'ID', key: 'id', width: 38 },
  { header: 'Estado', key: 'estado', width: 12 },
  { header: 'Proveedor', key: 'proveedor', width: 25 },
  { header: 'Usuario', key: 'usuario', width: 25 },
  { header: 'Fecha Pedido', key: 'fechaPedido', width: 15 },
  { header: 'Fecha Entrega', key: 'fechaEntrega', width: 15 },
  { header: 'Nº Líneas', key: 'numLineas', width: 10 },
  { header: 'Subtotal (€)', key: 'subtotal', width: 15, numFmt: '#,##0.00 €' },
  {
    header: 'Impuestos 21% (€)',
    key: 'impuestos',
    width: 18,
    numFmt: '#,##0.00 €',
  },
  { header: 'Total (€)', key: 'total', width: 15, numFmt: '#,##0.00 €' },
  { header: 'Motivo Cancelación', key: 'motivoCancelacion', width: 30 },
];

export function mapPedidoToExcelRow(pedido: Pedido): Record<string, unknown> {
  const subtotal = Number(pedido.costeTotal ?? 0);
  const impuestos = subtotal * IVA_RATE;
  const total = subtotal + impuestos;

  return {
    id: pedido.id,
    estado: pedido.estado,
    proveedor: pedido.proveedor?.nombre ?? '',
    usuario: pedido.usuario?.nombre ?? '',
    fechaPedido: pedido.fechaPedido?.toISOString().split('T')[0] ?? '',
    fechaEntrega: pedido.fechaEntrega?.toISOString().split('T')[0] ?? '',
    numLineas: pedido.pedidoProductos?.length ?? 0,
    subtotal,
    impuestos,
    total,
    motivoCancelacion: pedido.motivoCancelacion ?? '',
  };
}

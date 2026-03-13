import { Movimiento } from '../../movimiento/movimiento.entity/movimiento.entity';
import { ExportColumn } from './producto-export.mapper';

export const MOVIMIENTO_COLUMNS: ExportColumn[] = [
  { header: 'ID', key: 'id', width: 38 },
  { header: 'Tipo', key: 'tipo', width: 18 },
  { header: 'Cantidad', key: 'cantidad', width: 12 },
  { header: 'Usuario', key: 'usuario', width: 25 },
  { header: 'Producto', key: 'producto', width: 30 },
  { header: 'Entidad Tipo', key: 'entidad', width: 20 },
  { header: 'Entidad ID', key: 'entidadId', width: 38 },
  { header: 'Descripción', key: 'descripcion', width: 50 },
  { header: 'Fecha', key: 'createdAt', width: 15 },
];

export function mapMovimientoToExcelRow(
  movimiento: Movimiento
): Record<string, unknown> {
  return {
    id: movimiento.id,
    tipo: movimiento.tipo,
    cantidad: Number(movimiento.cantidad),
    usuario: movimiento.usuario?.username ?? '',
    producto: movimiento.productoProveedor?.producto?.nombre ?? '',
    entidad: movimiento.entidad,
    entidadId: movimiento.entidadId,
    descripcion: movimiento.descripcion ?? '',
    createdAt: movimiento.createdAt?.toISOString().split('T')[0] ?? '',
  };
}

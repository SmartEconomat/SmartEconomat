import { Recepcion } from '../../recepcion/recepcion.entity/recepcion.entity';
import { ExportColumn } from './producto-export.mapper';

/** Constantes públicas (RECEPCION_COLUMNS) expuestas en smart-economat-backend (Nest). */
export const RECEPCION_COLUMNS: ExportColumn[] = [
  { header: 'ID', key: 'id', width: 38 },
  { header: 'Fecha Recepción', key: 'fechaRecepcion', width: 17 },
  { header: 'Estado', key: 'estado', width: 18 },
  { header: 'Usuario', key: 'usuario', width: 25 },
  { header: 'Nº Pedidos', key: 'numPedidos', width: 12 },
  { header: 'Observaciones', key: 'observaciones', width: 50 },
  { header: 'Fecha Creación', key: 'createdAt', width: 15 },
];

/**
 * Expone "mapRecepcionToExcelRow" en smart-economat-backend (Nest).
 * @undefined {Recepcion} recepcion - Entrada efectiva esperada por el contrato.
 * @undefined {Record<string, unknown>} Datos efectivos después de ejecutar la operación.
 */
export function mapRecepcionToExcelRow(
  recepcion: Recepcion
): Record<string, unknown> {
  return {
    id: recepcion.id,
    fechaRecepcion: recepcion.fechaRecepcion?.toISOString().split('T')[0] ?? '',
    estado: recepcion.estado,
    usuario: recepcion.usuario?.username ?? '',
    numPedidos: recepcion.recepcionesPedidos?.length ?? 0,
    observaciones: recepcion.observaciones ?? '',
    createdAt: recepcion.createdAt?.toISOString().split('T')[0] ?? '',
  };
}

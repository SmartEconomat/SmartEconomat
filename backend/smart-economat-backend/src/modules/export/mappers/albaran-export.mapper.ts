import { Albaran } from '../../albaran/albaran.entity/albaran.entity';
import { ExportColumn } from './producto-export.mapper';

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
export const ALBARAN_COLUMNS: ExportColumn[] = [
  { header: 'ID', key: 'id', width: 38 },
  { header: 'Nº Albarán', key: 'nAlbaran', width: 20 },
  { header: 'Concordancia', key: 'concordancia', width: 15 },
  { header: 'Fecha', key: 'fecha', width: 15 },
  { header: 'Nº Recepciones', key: 'nRecepciones', width: 15 },
  { header: 'Fecha Creación', key: 'createdAt', width: 15 },
];

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
/**
 * Expone "mapAlbaranToExcelRow" en smart-economat-backend (Nest).
 * @undefined {Albaran} albaran - Entrada efectiva esperada por el contrato.
 * @undefined {Record<string, unknown>} Datos efectivos después de ejecutar la operación.
 */
export function mapAlbaranToExcelRow(
  albaran: Albaran
): Record<string, unknown> {
  return {
    id: albaran.id,
    nAlbaran: albaran.nAlbaran,
    concordancia:
      albaran.concordancia === true
        ? 'Sí'
        : albaran.concordancia === false
          ? 'No'
          : '',
    fecha: albaran.fecha?.toISOString().split('T')[0] ?? '',
    nRecepciones: albaran.albaranPedidoRecepcion?.length ?? 0,
    createdAt: albaran.createdAt?.toISOString().split('T')[0] ?? '',
  };
}

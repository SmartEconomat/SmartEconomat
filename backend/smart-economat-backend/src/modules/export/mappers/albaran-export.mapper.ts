import { Albaran } from '../../albaran/albaran.entity/albaran.entity';
import { ExportColumn } from './producto-export.mapper';

/**
 * @description Column definitions used when exporting Albaran data to Excel/CSV.
 * Each entry specifies the column header label, the data key, and the column width.
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
 * @description Maps an Albaran entity to a flat key-value record suitable for an Excel row.
 * Boolean concordancia is converted to 'Sí'/'No', dates are formatted as ISO date strings
 * (YYYY-MM-DD), and the number of linked recepciones is resolved from the relation array.
 * @param albaran - The Albaran entity to map (requires `albaranPedidoRecepcion` relation loaded for nRecepciones).
 * @returns A plain record whose keys match the keys declared in {@link ALBARAN_COLUMNS}.
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

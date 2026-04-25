import { Incidencia } from '../../incidencia/incidencia.entity/incidencia.entity';
import { ExportColumn } from './producto-export.mapper';

/**
 * @description Column definitions used when exporting Incidencia data to Excel/CSV.
 * Each entry specifies the column header label, the data key, and the column width.
 */
export const INCIDENCIA_COLUMNS: ExportColumn[] = [
  { header: 'ID', key: 'id', width: 38 },
  { header: 'Estado', key: 'estado', width: 12 },
  { header: 'Proveedor', key: 'proveedor', width: 25 },
  { header: 'Usuario Resolutor', key: 'usuarioResolutor', width: 25 },
  { header: 'Nº Líneas', key: 'numLineas', width: 10 },
  { header: 'Obs. Recepción', key: 'observacionesRecepcion', width: 40 },
  { header: 'Obs. Resolución', key: 'observacionesResolucion', width: 40 },
  { header: 'Fecha Resolución', key: 'fechaResolucion', width: 17 },
  { header: 'Fecha Creación', key: 'createdAt', width: 15 },
];

/**
 * @description Maps an Incidencia entity to a flat key-value record suitable for an Excel row.
 * Resolution status is derived via `incidencia.estaResuelta()`, nested relation names are
 * resolved with null-safe access, and dates are formatted as ISO date strings (YYYY-MM-DD).
 * @param incidencia - The Incidencia entity to map (requires `pedido.proveedor`, `usuarioResolutor`,
 *   and `lineas` relations loaded for accurate output).
 * @returns A plain record whose keys match the keys declared in {@link INCIDENCIA_COLUMNS}.
 */
export function mapIncidenciaToExcelRow(
  incidencia: Incidencia
): Record<string, unknown> {
  return {
    id: incidencia.id,
    estado: incidencia.estaResuelta() ? 'Resuelta' : 'Pendiente',
    proveedor: incidencia.pedido?.proveedor?.nombre ?? '',
    usuarioResolutor: incidencia.usuarioResolutor?.username ?? '',
    numLineas: incidencia.lineas?.length ?? 0,
    observacionesRecepcion: incidencia.observacionesRecepcion ?? '',
    observacionesResolucion: incidencia.observacionesResolucion ?? '',
    fechaResolucion:
      incidencia.fechaResolucion?.toISOString().split('T')[0] ?? '',
    createdAt: incidencia.createdAt?.toISOString().split('T')[0] ?? '',
  };
}

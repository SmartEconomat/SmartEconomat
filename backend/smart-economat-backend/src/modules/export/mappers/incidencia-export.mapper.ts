import { Incidencia } from '../../incidencia/incidencia.entity/incidencia.entity';
import { ExportColumn } from './producto-export.mapper';

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
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
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
/**
 * Expone "mapIncidenciaToExcelRow" en smart-economat-backend (Nest).
 * @undefined {Incidencia} incidencia - Entrada efectiva esperada por el contrato.
 * @undefined {Record<string, unknown>} Datos efectivos después de ejecutar la operación.
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

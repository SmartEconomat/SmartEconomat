import { Ubicacion } from '../../ubicacion/ubicacion.entity/ubicacion.entity';
import { ExportColumn } from './producto-export.mapper';

/** Constantes públicas (UBICACION_COLUMNS) expuestas en smart-economat-backend (Nest). */
export const UBICACION_COLUMNS: ExportColumn[] = [
  { header: 'ID', key: 'id', width: 38 },
  { header: 'Nombre', key: 'nombre', width: 30 },
  { header: 'Descripción', key: 'descripcion', width: 50 },
  { header: 'Fecha Creación', key: 'createdAt', width: 15 },
];

/**
 * Expone "mapUbicacionToExcelRow" en smart-economat-backend (Nest).
 * @undefined {Ubicacion} ubicacion - Entrada efectiva esperada por el contrato.
 * @undefined {Record<string, unknown>} Datos efectivos después de ejecutar la operación.
 */
export function mapUbicacionToExcelRow(
  ubicacion: Ubicacion
): Record<string, unknown> {
  return {
    id: ubicacion.id,
    nombre: ubicacion.nombre,
    descripcion: ubicacion.descripcion ?? '',
    createdAt: ubicacion.createdAt?.toISOString().split('T')[0] ?? '',
  };
}

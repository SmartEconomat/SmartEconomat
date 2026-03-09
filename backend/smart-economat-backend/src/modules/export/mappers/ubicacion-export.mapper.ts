import { Ubicacion } from '../../ubicacion/ubicacion.entity/ubicacion.entity';
import { ExportColumn } from './producto-export.mapper';

export const UBICACION_COLUMNS: ExportColumn[] = [
  { header: 'ID', key: 'id', width: 38 },
  { header: 'Nombre', key: 'nombre', width: 30 },
  { header: 'Descripción', key: 'descripcion', width: 50 },
  { header: 'Fecha Creación', key: 'createdAt', width: 15 },
];

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

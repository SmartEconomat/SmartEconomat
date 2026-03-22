import { Receta } from '../../receta/receta.entity/receta.entity';
import { ExportColumn } from './producto-export.mapper';

export const RECETA_COLUMNS: ExportColumn[] = [
  { header: 'ID', key: 'id', width: 38 },
  { header: 'Nombre', key: 'nombre', width: 30 },
  { header: 'Dificultad', key: 'dificultad', width: 12 },
  { header: 'Tiempo (min)', key: 'tiempoEstimadoMinutos', width: 15 },
  { header: 'Nº Ingredientes', key: 'numIngredientes', width: 15 },
  { header: 'Ingredientes', key: 'ingredientes', width: 60 },
  { header: 'Fecha Creación', key: 'createdAt', width: 15 },
];

export function mapRecetaToExcelRow(receta: Receta): Record<string, unknown> {
  const ingredientes = (receta.ingredientes ?? [])
    .map((i) => `${i.producto?.nombre ?? ''} (${i.cantidad} ${i.unidad})`)
    .filter(Boolean)
    .join(', ');

  return {
    id: receta.id,
    nombre: receta.nombre,
    dificultad: receta.dificultad,
    tiempoEstimadoMinutos: receta.tiempoEstimadoMinutos,
    numIngredientes: receta.ingredientes?.length ?? 0,
    ingredientes,
    createdAt: receta.createdAt?.toISOString().split('T')[0] ?? '',
  };
}

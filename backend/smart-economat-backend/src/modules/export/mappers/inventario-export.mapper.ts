import { Inventario } from '../../inventario/inventario.entity/inventario.entity';
import { ExportColumn } from './producto-export.mapper';

/**
 * @description Column definitions used when exporting Inventario data to Excel/CSV.
 * Each entry specifies the column header label, the data key, and the column width.
 */
export const INVENTARIO_COLUMNS: ExportColumn[] = [
  { header: 'ID', key: 'id', width: 38 },
  { header: 'Producto', key: 'producto', width: 30 },
  { header: 'Proveedor', key: 'proveedor', width: 25 },
  { header: 'Ubicación', key: 'ubicacion', width: 20 },
  { header: 'Cantidad Actual', key: 'cantidadActual', width: 15 },
  { header: 'Cantidad Mínima', key: 'cantidadMinima', width: 15 },
  { header: 'Cantidad Máxima', key: 'cantidadMaxima', width: 15 },
  { header: 'Bajo Stock', key: 'bajoStock', width: 12 },
  { header: 'Fecha Entrada', key: 'fechaEntrada', width: 15 },
  { header: 'Fecha Caducidad', key: 'fechaCaducidad', width: 16 },
  { header: 'Fecha Creación', key: 'createdAt', width: 15 },
];

/**
 * @description Maps an Inventario entity to a flat key-value record suitable for an Excel row.
 * Numeric quantities are cast to `Number`, nullable `cantidadMaxima` is represented as an
 * empty string when absent, `bajoStock` is derived via `inventario.esBajoStock()`,
 * and dates are formatted as ISO date strings (YYYY-MM-DD).
 * @param inventario - The Inventario entity to map (requires `productoProveedor.producto`,
 *   `productoProveedor.proveedor`, and `ubicacion` relations loaded for accurate output).
 * @returns A plain record whose keys match the keys declared in {@link INVENTARIO_COLUMNS}.
 */
export function mapInventarioToExcelRow(
  inventario: Inventario
): Record<string, unknown> {
  return {
    id: inventario.id,
    producto: inventario.productoProveedor?.producto?.nombre ?? '',
    proveedor: inventario.productoProveedor?.proveedor?.nombre ?? '',
    ubicacion: inventario.ubicacion?.nombre ?? '',
    cantidadActual: Number(inventario.cantidadActual),
    cantidadMinima: Number(inventario.cantidadMinima),
    cantidadMaxima:
      inventario.cantidadMaxima != null
        ? Number(inventario.cantidadMaxima)
        : '',
    bajoStock: inventario.esBajoStock() ? 'Sí' : 'No',
    fechaEntrada: inventario.fechaEntrada?.toISOString().split('T')[0] ?? '',
    fechaCaducidad:
      inventario.fechaCaducidad?.toISOString().split('T')[0] ?? '',
    createdAt: inventario.createdAt?.toISOString().split('T')[0] ?? '',
  };
}

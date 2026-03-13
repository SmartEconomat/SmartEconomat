import { Producto } from '../../producto/producto.entity/producto.entity';

export type ExportColumn = {
  header: string;
  key: string;
  width: number;
  numFmt?: string;
};

export const PRODUCTO_COLUMNS: ExportColumn[] = [
  { header: 'ID', key: 'id', width: 38 },
  { header: 'Nombre', key: 'nombre', width: 30 },
  { header: 'Marca', key: 'marca', width: 20 },
  { header: 'Categoría', key: 'tipo', width: 15 },
  { header: 'Unidad', key: 'unidad', width: 10 },
  { header: 'Contenido', key: 'contenido', width: 12 },
  { header: 'Código de Barras', key: 'codigoBarras', width: 18 },
  { header: 'Alérgenos', key: 'alergenos', width: 40 },
  { header: 'Proveedores', key: 'proveedores', width: 35 },
  { header: 'Descripción', key: 'descripcion', width: 50 },
  { header: 'Fecha Creación', key: 'createdAt', width: 15 },
];

export function mapProductoToExcelRow(
  producto: Producto
): Record<string, unknown> {
  const proveedores = (producto.proveedores ?? [])
    .map((pp) => pp.proveedor?.nombre ?? '')
    .filter(Boolean)
    .join(', ');

  const alergenos = (producto.alergenos ?? [])
    .map((a) => a.alergeno)
    .join(', ');

  return {
    id: producto.id,
    nombre: producto.nombre,
    marca: producto.marca ?? '',
    tipo: producto.tipo ?? '',
    unidad: producto.unidad ?? '',
    contenido: producto.contenido,
    codigoBarras: producto.codigoBarras ?? '',
    alergenos,
    proveedores,
    descripcion: producto.descripcion ?? '',
    createdAt: producto.createdAt?.toISOString().split('T')[0] ?? '',
  };
}

import { Proveedor } from '../../proveedor/proveedor.entity/proveedor.entity';
import { ExportColumn } from './producto-export.mapper';

/** Constantes públicas (PROVEEDOR_COLUMNS) expuestas en smart-economat-backend (Nest). */
export const PROVEEDOR_COLUMNS: ExportColumn[] = [
  { header: 'ID', key: 'id', width: 38 },
  { header: 'Nombre', key: 'nombre', width: 30 },
  { header: 'Contacto', key: 'contacto', width: 25 },
  { header: 'Teléfono', key: 'telefono', width: 15 },
  { header: 'Email', key: 'email', width: 30 },
  { header: 'Dirección', key: 'direccion', width: 40 },
  { header: 'NIF', key: 'nif', width: 15 },
  { header: 'Fecha Alta', key: 'createdAt', width: 15 },
];

/**
 * Expone "mapProveedorToExcelRow" en smart-economat-backend (Nest).
 * @undefined {Proveedor} proveedor - Entrada efectiva esperada por el contrato.
 * @undefined {Record<string, unknown>} Datos efectivos después de ejecutar la operación.
 */
export function mapProveedorToExcelRow(
  proveedor: Proveedor
): Record<string, unknown> {
  return {
    id: proveedor.id,
    nombre: proveedor.nombre,
    contacto: proveedor.contacto ?? '',
    telefono: proveedor.telefono ?? '',
    email: proveedor.email ?? '',
    direccion: proveedor.direccion ?? '',
    nif: proveedor.nif ?? '',
    createdAt: proveedor.createdAt?.toISOString().split('T')[0] ?? '',
  };
}

import { Usuario } from '../../usuario/usuario.entity/usuario.entity';
import { ExportColumn } from './producto-export.mapper';

/**
 * @description Column definitions used when exporting Usuario data to Excel/CSV.
 * Each entry specifies the column header label, the data key, and the column width.
 */
export const USUARIO_COLUMNS: ExportColumn[] = [
  { header: 'ID', key: 'id', width: 38 },
  { header: 'Nombre', key: 'nombre', width: 25 },
  { header: 'Username', key: 'username', width: 20 },
  { header: 'Email', key: 'email', width: 35 },
  { header: 'Rol', key: 'rol', width: 12 },
  { header: 'Activo', key: 'activo', width: 10 },
  { header: 'Aula', key: 'aula', width: 12 },
  { header: 'Cial Profesor', key: 'cialProfesor', width: 18 },
  { header: 'Fecha Creación', key: 'createdAt', width: 15 },
];

/**
 * @description Maps a Usuario entity to a flat key-value record suitable for an Excel row.
 * Boolean `activo` is converted to 'Sí'/'No', the optional profesor CIAL is resolved
 * with null-safe access, and `createdAt` is formatted as an ISO date string (YYYY-MM-DD).
 * @param usuario - The Usuario entity to map (requires the `profesor` relation loaded
 *   for `cialProfesor` to be populated).
 * @returns A plain record whose keys match the keys declared in {@link USUARIO_COLUMNS}.
 */
export function mapUsuarioToExcelRow(
  usuario: Usuario
): Record<string, unknown> {
  return {
    id: usuario.id,
    nombre: usuario.username,
    username: usuario.username,
    email: usuario.email,
    rol: usuario.rol,
    activo: usuario.activo ? 'Sí' : 'No',
    aula: '',
    cialProfesor: usuario.profesor?.cial ?? '',
    createdAt: usuario.createdAt?.toISOString().split('T')[0] ?? '',
  };
}

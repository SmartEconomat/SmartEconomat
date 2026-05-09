import { Usuario } from '../../usuario/usuario.entity/usuario.entity';
import { ExportColumn } from './producto-export.mapper';

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
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
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
/**
 * Expone "mapUsuarioToExcelRow" en smart-economat-backend (Nest).
 * @undefined {Usuario} usuario - Entrada efectiva esperada por el contrato.
 * @undefined {Record<string, unknown>} Datos efectivos después de ejecutar la operación.
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

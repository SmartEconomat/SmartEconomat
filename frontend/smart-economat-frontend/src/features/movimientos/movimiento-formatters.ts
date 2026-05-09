import { UsuarioBasico } from '../../services/movimiento.types';

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
/**
 * Obtiene valores o vistas materializadas.
 * @undefined {UsuarioBasico | undefined} usuario - Entrada efectiva esperada por el contrato.
 * @undefined {string} Datos efectivos después de ejecutar la operación.
 */
export function getMovimientoUsuarioDisplayName(
  usuario?: UsuarioBasico
): string {
  const nombre = usuario?.nombre?.trim();
  if (nombre) {
    return nombre;
  }

  const username = usuario?.username?.trim();
  if (username) {
    return username;
  }

  const email = usuario?.email?.trim();
  if (email) {
    return email;
  }

  return '—';
}

/**
 * Obtiene movimiento usuario initial.
 *
 * @param usuario Parámetro de entrada para la operación. Opcional.
 * @returns Valor resultante de la operación.
 */
export function getMovimientoUsuarioInitial(usuario?: UsuarioBasico): string {
  const displayName = getMovimientoUsuarioDisplayName(usuario);

  if (displayName === '—') {
    return 'U';
  }

  return displayName.charAt(0).toUpperCase();
}

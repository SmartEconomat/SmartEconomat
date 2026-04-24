import { UsuarioBasico } from '../../services/movimiento.types';

/**
 * @description Resolves the best available display name for a movimiento's associated user.
 * Priority: nombre > username > email. Returns '—' when no information is available.
 * @param usuario - Optional partial user object from the movimiento
 * @returns Display name string or '—'
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
 * @description Returns a single uppercase initial character for an avatar derived from the user's display name.
 * Falls back to 'U' when no display name can be resolved.
 * @param usuario - Optional partial user object from the movimiento
 * @returns Single uppercase letter for use in avatar components
 */
export function getMovimientoUsuarioInitial(usuario?: UsuarioBasico): string {
  const displayName = getMovimientoUsuarioDisplayName(usuario);

  if (displayName === '—') {
    return 'U';
  }

  return displayName.charAt(0).toUpperCase();
}

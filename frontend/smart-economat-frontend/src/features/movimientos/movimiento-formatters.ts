import { UsuarioBasico } from '../../services/movimiento.types';

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

export function getMovimientoUsuarioInitial(usuario?: UsuarioBasico): string {
  const displayName = getMovimientoUsuarioDisplayName(usuario);

  if (displayName === '—') {
    return 'U';
  }

  return displayName.charAt(0).toUpperCase();
}

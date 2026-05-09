import { randomUUID } from 'node:crypto';

/**
 * Normaliza texto en un código estable para ubicación (ASCII, lowercase, underscores).
 */
export function slugifyUbicacionCodigo(nombre: string): string {
  const raw = nombre
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48);

  return raw.length > 0 ? raw : '';
}

/** Genera código único de respaldo cuando el slug queda vacío o colisiona. */
export function generarCodigoUbicacionRespaldo(): string {
  return `u_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
}

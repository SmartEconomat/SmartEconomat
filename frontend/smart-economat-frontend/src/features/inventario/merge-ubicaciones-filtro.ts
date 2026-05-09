import type { Ubicacion } from '../../services/ubicacion.types';

/** Lote o fila con ubicación opcional (evita acoplar con `InventarioItem` completo). */
export type ItemUbicacionInferible = {
  ubicacion?: { id?: string; nombre?: string } | null;
};

export interface UbicacionFiltroFuente {
  id: string;
  nombre: string;
}

/**
 * Firma estable de ubicaciones inferidas por lotes (según id+nombre).
 * Evita recrear arrays en cada render cuando `rawItems` cambia solo por referencia.
 */
export function inferidasPorLotesFirma(
  items: ItemUbicacionInferible[]
): string {
  const byId = new Map<string, string>();
  for (const item of items) {
    const u = item.ubicacion;
    const id = u?.id?.trim();
    const nombre = u?.nombre?.trim();
    if (!id || !nombre) continue;
    if (!byId.has(id)) byId.set(id, nombre);
  }

  const pairs = [...byId.entries()].sort((a, b) =>
    a[0].localeCompare(b[0], 'es')
  );

  return JSON.stringify(pairs);
}

/**
 * Restaura ubicaciones desde `inferidasPorLotesFirma`.
 */
export function ubicacionesDesdeFirmaInferidasLotes(
  firma: string
): Ubicacion[] {
  try {
    const parsed = JSON.parse(firma) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    const out: Ubicacion[] = [];
    for (const row of parsed) {
      if (!Array.isArray(row) || row.length < 2) continue;
      const id = typeof row[0] === 'string' ? row[0] : '';
      const nombre = typeof row[1] === 'string' ? row[1] : '';
      if (!id.trim() || !nombre.trim()) continue;
      out.push({ id: id.trim(), nombre: nombre.trim() });
    }
    return out;
  } catch {
    return [];
  }
}

/**
 * Combina el catálogo de ubicaciones API, las asignadas al usuario y las inferidas de lotes cargados.
 */
export function mergeUbicacionesParaFiltros(
  desdeApi: Ubicacion[],
  asignadas: UbicacionFiltroFuente[],
  desdeInventario: UbicacionFiltroFuente[]
): Ubicacion[] {
  const map = new Map<string, Ubicacion>();

  for (const u of desdeApi) {
    map.set(u.id, { ...u });
  }
  for (const m of asignadas) {
    if (!map.has(m.id)) {
      map.set(m.id, { id: m.id, nombre: m.nombre });
    }
  }
  for (const m of desdeInventario) {
    if (m.id && !map.has(m.id)) {
      map.set(m.id, { id: m.id, nombre: m.nombre });
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    a.nombre.localeCompare(b.nombre, 'es')
  );
}

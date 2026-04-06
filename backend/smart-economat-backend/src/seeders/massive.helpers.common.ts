import { SeedContext } from './seed-context';
import { EnumCoverage } from './massive.types';
import {
  ALERGEN_VALUES,
  INCIDENCIA_TIPOS,
  MERMA_MOTIVOS,
  MOVIMIENTO_MANUAL_TYPES,
  MOVIMIENTO_TYPES,
  PRODUCT_TYPES,
  PRODUCT_UNITS,
  RECEPCION_ESTADO_PRODUCTO,
  RECEPCION_ESTADO_VISUAL,
  RECETA_DIFICULTAD,
  RECETA_UNIDADES,
  RESOLUCION_TIPOS,
  USER_ROLES,
  USER_STATUSES,
} from './massive.config';

export function normalizePath(path: string): string {
  const withSlash = path.startsWith('/') ? path : `/${path}`;
  return withSlash.replace(/\/+/, '/').replace(/\/$/, '') || '/';
}

export function normalizeIdentityValue(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim().toLowerCase();
}

export function pickByCursor<T>(context: SeedContext, values: readonly T[]): T {
  const cursor = context.getState<number>('seedEnumCursor') || 0;
  context.set('seedEnumCursor', cursor + 1);
  return values[cursor % values.length];
}

export function createEnumCoverage(): EnumCoverage {
  return {
    userRoles: new Set<string>(),
    userStatuses: new Set<string>(),
    productUnits: new Set<string>(),
    productTypes: new Set<string>(),
    allergens: new Set<string>(),
    movimientoTypes: new Set<string>(),
    movimientoManualTypes: new Set<string>(),
    recetaDificultad: new Set<string>(),
    recetaUnidades: new Set<string>(),
    incidenciaTipos: new Set<string>(),
    incidenciaResoluciones: new Set<string>(),
    mermaMotivos: new Set<string>(),
    recepcionEstadoVisual: new Set<string>(),
    recepcionEstadoProducto: new Set<string>(),
  };
}

export function markEnum(
  coverage: EnumCoverage,
  key: keyof EnumCoverage,
  value: string
): void {
  coverage[key].add(value);
}

export function ensureEnumCoverageComplete(coverage: EnumCoverage): string[] {
  const requirements: Array<{
    key: keyof EnumCoverage;
    values: readonly string[];
  }> = [
    { key: 'userRoles', values: USER_ROLES },
    { key: 'userStatuses', values: USER_STATUSES },
    { key: 'productUnits', values: PRODUCT_UNITS },
    { key: 'productTypes', values: PRODUCT_TYPES },
    { key: 'allergens', values: ALERGEN_VALUES },
    { key: 'movimientoTypes', values: MOVIMIENTO_TYPES },
    { key: 'movimientoManualTypes', values: MOVIMIENTO_MANUAL_TYPES },
    { key: 'recetaDificultad', values: RECETA_DIFICULTAD },
    { key: 'recetaUnidades', values: RECETA_UNIDADES },
    { key: 'incidenciaTipos', values: INCIDENCIA_TIPOS },
    { key: 'incidenciaResoluciones', values: RESOLUCION_TIPOS },
    { key: 'mermaMotivos', values: MERMA_MOTIVOS },
    { key: 'recepcionEstadoVisual', values: RECEPCION_ESTADO_VISUAL },
    { key: 'recepcionEstadoProducto', values: RECEPCION_ESTADO_PRODUCTO },
  ];

  const missing: string[] = [];
  for (const requirement of requirements) {
    for (const expected of requirement.values) {
      if (!coverage[requirement.key].has(expected)) {
        missing.push(`${requirement.key}:${expected}`);
      }
    }
  }

  return missing;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function hasSoftDeleteMarker(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  if (value instanceof Date) {
    return !Number.isNaN(value.getTime());
  }

  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  return true;
}

export function isSoftDeletedEntity(entity: Record<string, unknown>): boolean {
  return (
    hasSoftDeleteMarker(entity.deletedAt) ||
    hasSoftDeleteMarker(entity.deleted_at) ||
    hasSoftDeleteMarker(entity.deletedBy) ||
    hasSoftDeleteMarker(entity.deleted_by)
  );
}

export function extractActiveEntityIds(
  entities: Array<Record<string, unknown>>
): string[] {
  return Array.from(
    new Set(
      entities
        .filter((entity) => !isSoftDeletedEntity(entity))
        .map((entity) =>
          typeof entity.id === 'string' ? entity.id.trim() : ''
        )
        .filter((id): id is string => id.length > 0)
    )
  );
}

export function listFromResponse(
  response: unknown
): Array<Record<string, unknown>> {
  const asRecordArray = (
    value: unknown
  ): Array<Record<string, unknown>> | null => {
    if (!Array.isArray(value)) {
      return null;
    }

    return value.filter(isRecord);
  };

  const directArray = asRecordArray(response);
  if (directArray) {
    return directArray;
  }

  if (!isRecord(response)) {
    return [];
  }

  for (const key of ['data', 'items', 'rows', 'results']) {
    const directCandidate = asRecordArray(response[key]);
    if (directCandidate) {
      return directCandidate;
    }

    const nestedValue = response[key];
    if (!isRecord(nestedValue)) {
      continue;
    }

    for (const nestedKey of ['data', 'items', 'rows', 'results']) {
      const nestedCandidate = asRecordArray(nestedValue[nestedKey]);
      if (nestedCandidate) {
        return nestedCandidate;
      }
    }
  }

  return [response];
}

export function toEntityArray(
  response: unknown
): Array<Record<string, unknown>> {
  const entities: Array<Record<string, unknown>> = [];

  const collect = (value: unknown): void => {
    if (Array.isArray(value)) {
      for (const item of value) {
        collect(item);
      }
      return;
    }

    if (!isRecord(value)) {
      return;
    }

    entities.push(value);

    for (const key of [
      'data',
      'items',
      'rows',
      'results',
      'lineas',
      'pedidoProductos',
      'productos',
      'proveedores',
      'alumnos',
      'ingredientes',
    ]) {
      const nested = value[key];
      if (Array.isArray(nested) || isRecord(nested)) {
        collect(nested);
      }
    }
  };

  collect(response);
  return entities;
}

export function extractResourceId(response: unknown): string | undefined {
  for (const entity of toEntityArray(response)) {
    if (typeof entity.id === 'string') {
      return entity.id;
    }
  }
  return undefined;
}

export function extractFilename(value: unknown): string | null {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return null;
  }

  const cleaned = value.split('?')[0].trim();
  const parts = cleaned.split('/').filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] || null : null;
}

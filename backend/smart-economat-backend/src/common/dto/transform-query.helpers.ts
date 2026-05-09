/**
 * Utilidades tipadas para @Transform en DTOs de consulta (class-transformer).
 */
export function firstNonEmptyString(...vals: unknown[]): string | undefined {
  for (const v of vals) {
    if (v == null || v === '') {
      continue;
    }
    if (typeof v === 'string') {
      return v;
    }
  }
  return undefined;
}

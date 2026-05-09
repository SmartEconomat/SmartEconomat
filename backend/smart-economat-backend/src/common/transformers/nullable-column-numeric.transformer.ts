/**
 * Transformer para columnas `numeric` opcionales: preserva `NULL` en base de datos.
 * `ColumnNumericTransformer` fuerza `null`/`undefined` → `0`, lo cual viola constraints
 * del tipo `"col_maxima" IS NULL OR "col_maxima" >= "col_minima"` cuando el mínimo es > 0.
 */
export class NullableColumnNumericTransformer {
  /** Entity → persistencia */
  to(value: number | null | undefined): number | null {
    if (value === null || value === undefined) return null;
    return Number(value);
  }

  /** Lectura desde PostgreSQL */
  from(value: string | number | null | undefined): number | null {
    if (value === null || value === undefined || value === '') return null;
    const parsed =
      typeof value === 'number' ? value : parseFloat(String(value));
    return Number.isFinite(parsed) ? parsed : null;
  }
}

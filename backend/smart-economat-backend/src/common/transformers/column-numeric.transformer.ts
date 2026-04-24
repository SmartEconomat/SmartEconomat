/**
 * @module ColumnNumericTransformer
 * TypeORM column transformer for `numeric` / `decimal` database columns.
 *
 * PostgreSQL returns `numeric` columns as strings to preserve precision. This
 * transformer converts them to JavaScript `number` values on read, and coerces
 * `null` / `undefined` writes to `0` to avoid DB constraint violations.
 *
 * Register on a TypeORM column using the `transformer` option:
 * @example
 * \@Column({ type: 'numeric', precision: 10, scale: 2, transformer: new ColumnNumericTransformer() })
 * precio: number;
 */

/**
 * TypeORM value transformer for `numeric`/`decimal` columns.
 *
 * @example
 * import { ColumnNumericTransformer } from '../transformers';
 *
 * \@Column({ type: 'numeric', precision: 10, scale: 4, transformer: new ColumnNumericTransformer() })
 * cantidad: number;
 */
export class ColumnNumericTransformer {
  /**
   * Serialises the JavaScript value before writing to the database.
   *
   * @param {number | null | undefined} data - The value to persist.
   * @returns {number} The numeric value to store, defaulting to `0` for `null`/`undefined`.
   */
  to(data: number | null | undefined): number {
    return data ?? 0;
  }

  /**
   * Deserialises the raw database value back to a JavaScript `number`.
   *
   * PostgreSQL returns `numeric` columns as strings; this method parses them.
   *
   * @param {string | number | null | undefined} data - The raw value from the database.
   * @returns {number} The parsed number, or `0` if the value is empty, `null`, `undefined`,
   *   or cannot be parsed to a finite number.
   */
  from(data: string | number | null | undefined): number {
    if (data === null || data === undefined || data === '') {
      return 0;
    }

    const parsed = typeof data === 'number' ? data : parseFloat(data);
    return Number.isFinite(parsed) ? parsed : 0;
  }
}

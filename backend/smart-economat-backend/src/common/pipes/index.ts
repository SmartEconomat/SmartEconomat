/**
 * @module PipesBarrel
 * Barrel export for all custom NestJS pipes used for validation and data normalisation
 * in the SmartEconomat application.
 *
 * Exported pipes:
 * - {@link ParseUUIDv7Pipe}  – validates UUID v7 route/query parameters
 * - {@link NormalizeDataPipe} – trims strings and coerces types before validation
 * - {@link NormalizeStringPipe} – configurable string normalisation transformer
 */

export { ParseUUIDv7Pipe } from './parse-uuid-v7.pipe';
export { NormalizeDataPipe } from './normalize-data.pipe';
export { NormalizeStringPipe } from './normalize-string.pipe';

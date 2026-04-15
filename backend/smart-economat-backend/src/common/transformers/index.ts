/**
 * @module TransformersBarrel
 * Barrel export for all custom class-transformer transformers used for normalising
 * incoming DTO data in the SmartEconomat application.
 *
 * Exported transformers:
 * - {@link TrimStringTransformer}       – removes leading/trailing whitespace from strings
 * - {@link UppercaseStringTransformer}  – converts strings to uppercase after trim
 * - {@link LowercaseStringTransformer}  – converts strings to lowercase after trim
 * - {@link StringToNumberTransformer}   – coerces string values to numbers
 * - {@link StringToBooleanTransformer}  – coerces string/number values to booleans
 * - {@link StringToDateTransformer}     – coerces string/number values to Date objects
 * - {@link NormalizeArrayTransformer}   – normalises arrays (split CSV strings, trim items)
 * - {@link ColumnNumericTransformer}    – TypeORM column transformer for numeric DB columns
 */

export { TrimStringTransformer } from './trim-string.transformer';
export { UppercaseStringTransformer } from './uppercase-string.transformer';
export { LowercaseStringTransformer } from './lowercase-string.transformer';
export { StringToNumberTransformer } from './string-to-number.transformer';
export { StringToBooleanTransformer } from './string-to-boolean.transformer';
export { StringToDateTransformer } from './string-to-date.transformer';
export { NormalizeArrayTransformer } from './normalize-array.transformer';
export { ColumnNumericTransformer } from './column-numeric.transformer';

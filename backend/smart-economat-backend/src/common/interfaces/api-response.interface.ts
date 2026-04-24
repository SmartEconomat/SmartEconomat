/**
 * @module ApiResponseInterface
 * Defines the standard envelope shape for every HTTP response produced by the
 * SmartEconomat API. The {@link TransformInterceptor} wraps all controller
 * return values in this structure before they are serialised to JSON.
 */

/**
 * Standard API response envelope used throughout the application.
 *
 * @template T - The type of the `data` payload.
 *
 * @example
 * // A successful paginated response
 * const res: ApiResponse<ProductoDto[]> = {
 *   success: true,
 *   message: 'Operación exitosa',
 *   data: [...],
 *   meta: { app: 'SmartEconomat', version: '1.0.0', timestamp: '...', environment: 'production', requestId: '...' },
 * };
 */
export interface ApiResponse<T> {
  /** Whether the operation completed without errors. */
  success: boolean;

  /** Human-readable status message, or `null` when no message applies. */
  message: string | null;

  /**
   * The response payload.
   * `null` on error responses or when the operation returns no content.
   */
  data: T | null;

  /**
   * Optional error detail attached to non-successful responses.
   * Intentionally typed as `unknown` to accommodate structured and unstructured errors.
   */
  error?: unknown;

  /** Request-scoped metadata useful for logging, tracing, and client diagnostics. */
  meta: {
    /** Application name identifier. */
    app: string;
    /** Running application version (semver). */
    version: string;
    /** ISO 8601 timestamp of when the response was generated. */
    timestamp: string;
    /** Runtime environment (`development`, `production`, `test`, etc.). */
    environment: string;
    /** Unique request identifier — echoed from the `x-request-id` header or auto-generated. */
    requestId: string;
  };
}

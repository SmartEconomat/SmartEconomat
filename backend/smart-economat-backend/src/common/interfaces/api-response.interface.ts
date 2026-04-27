/**
 * Documentación en español.
 */

/**
 * Documentación en español.
 */
export interface ApiResponse<T> {
  /**
   * Documentación en español.
   */
  success: boolean;

  /**
   * Documentación en español.
   */
  message: string | null;

  /**
   * Documentación en español.
   */
  data: T | null;

  /**
   * Documentación en español.
   */
  error?: unknown;

  /**
   * Documentación en español.
   */
  meta: {
    /**
     * Documentación en español.
     */
    app: string;
    /**
     * Documentación en español.
     */
    version: string;
    /**
     * Documentación en español.
     */
    timestamp: string;
    /**
     * Documentación en español.
     */
    environment: string;
    /**
     * Documentación en español.
     */
    requestId: string;
  };
}

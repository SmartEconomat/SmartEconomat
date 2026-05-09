/**
 * Interfaz genérica para las respuestas estandarizadas de la API.
 * Garantiza una estructura consistente en todas las peticiones.
 * @template T El tipo de datos que contiene la respuesta en el campo 'data'.
 */
export interface ApiResponse<T> {
  /** Indica si la operación se completó exitosamente. */
  success: boolean;

  /** Mensaje descriptivo del resultado de la operación, útil para feedback al usuario. */
  message: string | null;

  /** Carga útil de la respuesta con los datos solicitados. */
  data: T | null;

  /** Detalles del error en caso de que la operación falle. */
  error?: unknown;

  /** Metadatos de la respuesta para trazabilidad y auditoría. */
  meta: {
    /** Nombre de la aplicación que genera la respuesta. */
    app: string;
    /** Versión actual del backend. */
    version: string;
    /** Marca de tiempo ISO de la respuesta. */
    timestamp: string;
    /** Entorno de ejecución (development, production, etc.). */
    environment: string;
    /** ID único de la petición para seguimiento en logs. */
    requestId: string;
  };
}

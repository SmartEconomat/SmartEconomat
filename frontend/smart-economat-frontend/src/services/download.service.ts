import { baseFetch } from './api.service';

/**
 * Servicio centralizado para la descarga de archivos (PDF/Excel)
 * con manejo de timeouts, blobs y notificaciones de progreso.
 */

const EXPORT_TIMEOUT_MS = 30000;

/**
 * Options accepted by the download and blob helper methods.
 */
export interface DownloadOptions {
  /** Filename (including extension) to use when saving the downloaded file. */
  filename: string;
  /** Toast notification callbacks used to report progress. */
  toast: {
    /** Called when the download succeeds. */
    success: (msg: string) => void;
    /** Called when the download fails. */
    error: (msg: string) => void;
    /** Called when the download starts. */
    info: (msg: string) => void;
  };
}

/** Internal type for error objects with an optional name and message. */
interface ApiError {
  name?: string;
  message?: string;
}

/**
 * Centralised service for downloading files (PDF / Excel) from the backend
 * with timeout handling, blob management, and toast-based progress feedback.
 */
export class DownloadService {
  /**
   * Descarga un archivo desde el backend manejando el estado del toast y el timeout.
   *
   * @param {string} path - API path relative to the base URL.
   * @param {DownloadOptions} options - Filename and toast notification callbacks.
   * @returns {Promise<void>}
   * @throws {Error} If the download times out or the server returns an error.
   * @example
   * await DownloadService.downloadFile('/recetas/export/pdf?ids=1,2', {
   *   filename: 'recetas.pdf',
   *   toast: { success, error, info },
   * });
   */
  static async downloadFile(
    path: string,
    options: DownloadOptions
  ): Promise<void> {
    const { filename, toast } = options;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), EXPORT_TIMEOUT_MS);

    toast.info('Iniciando descarga...');

    try {
      const response = await baseFetch(path, {
        signal: controller.signal,
      });

      if (!response.ok) {
        // Intentar extraer mensaje de error del body si es JSON
        let errorMessage = `Error del servidor: ${response.status}`;
        try {
          const body = await response.json();
          if (body.message) errorMessage = body.message;
        } catch {
          // No es JSON, usar status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const blob = await response.blob();

      // Crear link temporal para la descarga
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();

      // Limpieza
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Exportación completada');
    } catch (error: unknown) {
      const err = error as ApiError;
      if (err.name === 'AbortError') {
        toast.error(
          'La exportación tardó demasiado, inténtalo con menos registros'
        );
      } else {
        toast.error(err.message || 'Error al procesar la exportación');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Abre un PDF en una nueva pestaña.
   *
   * @param {Blob} blob - The PDF blob to open.
   * @returns {void}
   * @example
   * const blob = await DownloadService.getBlob('/recetas/1/pdf', toast);
   * DownloadService.openPdfInNewTab(blob);
   */
  static openPdfInNewTab(blob: Blob) {
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
    // Nota: No podemos hacer revokeObjectURL inmediatamente porque la pestaña necesita la URL.
    // Navegadores modernos suelen manejar esto, pero es una limitación de blobs.
  }

  /**
   * Helper que envuelve baseFetch para obtener un blob directamente con feedback.
   *
   * @param {string} path - API path relative to the base URL.
   * @param {DownloadOptions['toast']} toast - Toast notification callbacks.
   * @returns {Promise<Blob>} The response blob.
   * @throws {Error} If the request times out or the server returns an error.
   * @example
   * const blob = await DownloadService.getBlob('/recetas/export/pdf?ids=1', toast);
   */
  static async getBlob(
    path: string,
    toast: DownloadOptions['toast']
  ): Promise<Blob> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), EXPORT_TIMEOUT_MS);

    toast.info('Generando documento...');

    try {
      const response = await baseFetch(path, {
        signal: controller.signal,
      });

      if (!response.ok) {
        let errorMessage = `Error: ${response.status}`;
        try {
          const body = await response.json();
          if (body.message) errorMessage = body.message;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      return await response.blob();
    } catch (error: unknown) {
      const err = error as ApiError;
      if (err.name === 'AbortError') {
        toast.error('La generación tardó demasiado, inténtalo de nuevo.');
      } else {
        toast.error(err.message || 'Error al generar el documento');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

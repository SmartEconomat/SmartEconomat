import { baseFetch } from './api.service';

/**
 * Documentación en español.
 */

const EXPORT_TIMEOUT_MS = 30000;

/**
 * Documentación en español.
 */
export interface DownloadOptions {
        /**
     * Documentación en español.
     */
  filename: string;
        /**
     * Documentación en español.
     */
  toast: {
                /**
         * Documentación en español.
         */
    success: (msg: string) => void;
                /**
         * Documentación en español.
         */
    error: (msg: string) => void;
                /**
         * Documentación en español.
         */
    info: (msg: string) => void;
  };
}

/**
 * Documentación en español.
 */
interface ApiError {
  name?: string;
  message?: string;
}

/**
 * Documentación en español.
 */
export class DownloadService {
        /**
     * Documentación en español.
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
     * Documentación en español.
     */
  static openPdfInNewTab(blob: Blob) {
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
    // Nota: No podemos hacer revokeObjectURL inmediatamente porque la pestaña necesita la URL.
    // Navegadores modernos suelen manejar esto, pero es una limitación de blobs.
  }

        /**
     * Documentación en español.
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

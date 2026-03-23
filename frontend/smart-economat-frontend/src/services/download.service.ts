import { baseFetch } from './api.service';

/**
 * Servicio centralizado para la descarga de archivos (PDF/Excel)
 * con manejo de timeouts, blobs y notificaciones de progreso.
 */

const EXPORT_TIMEOUT_MS = 30000;

export interface DownloadOptions {
  filename: string;
  toast: {
    success: (msg: string) => void;
    error: (msg: string) => void;
    info: (msg: string) => void;
  };
}

interface ApiError {
  name?: string;
  message?: string;
}

export class DownloadService {
  /**
   * Descarga un archivo desde el backend manejando el estado del toast y el timeout.
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
   */
  static openPdfInNewTab(blob: Blob) {
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
    // Nota: No podemos hacer revokeObjectURL inmediatamente porque la pestaña necesita la URL.
    // Navegadores modernos suelen manejar esto, pero es una limitación de blobs.
  }

  /**
   * Helper que envuelve baseFetch para obtener un blob directamente con feedback.
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

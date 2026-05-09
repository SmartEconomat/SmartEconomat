import { baseFetch } from './api.service';

/**
 * Servicio centralizado para operaciones de descarga y generación de documentos.
 * Encapsula lógica de timeouts, manejo de errores y feedback al usuario via toasts.
 */

const EXPORT_TIMEOUT_MS = 30000;

/**
 * Opciones de configuración para operaciones de descarga de archivos.
 */
export interface DownloadOptions {
  /** Nombre del archivo resultante (incluida la extensión). */
  filename: string;
  /** Objeto de notificaciones toast para feedback al usuario. */
  toast: {
    /** Muestra un toast de éxito. */
    success: (msg: string) => void;
    /** Muestra un toast de error. */
    error: (msg: string) => void;
    /** Muestra un toast informativo. */
    info: (msg: string) => void;
  };
}

/**
 * Forma tipada de un error de API para distinguir AbortError de errores de red.
 */
interface ApiError {
  name?: string;
  message?: string;
}

/**
 * Servicio estático para descarga de ficheros y apertura de PDFs desde endpoints REST.
 */
export class DownloadService {
  /**
   * Descarga un fichero desde un endpoint y lo persiste en el disco del usuario.
   * Implementa timeout configurable y feedback de progreso via toasts.
   * @param path Ruta del endpoint que sirve el fichero.
   * @param options Nombre de archivo y callbacks de notificación.
   */
  /**
   * Expone "downloadFile" en smart-economat-frontend (SPA).
   * @undefined {string} path - Entrada efectiva esperada por el contrato.
   * @undefined {DownloadOptions} options - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
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
   * Abre un Blob de PDF en una nueva pestaña del navegador.
   * @param blob Blob de datos binarios del documento PDF.
   */
  /**
   * Expone "openPdfInNewTab" en smart-economat-frontend (SPA).
   * @undefined {Blob} blob - Entrada efectiva esperada por el contrato.
   * @undefined {void} Datos efectivos después de ejecutar la operación.
   */
  static openPdfInNewTab(blob: Blob) {
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
    // Nota: No podemos hacer revokeObjectURL inmediatamente porque la pestaña necesita la URL.
    // Navegadores modernos suelen manejar esto, pero es una limitación de blobs.
  }

  /**
   * Obtiene el Blob de un documento generado por el backend.
   * Útil cuando se quiere manipular el binario antes de descargarlo o abrirlo.
   * @param path Ruta del endpoint generador del documento.
   * @param toast Callbacks de notificación al usuario.
   */
  /**
   * Obtiene valores o vistas materializadas.
   * @undefined {string} path - Entrada efectiva esperada por el contrato.
   * @undefined {{ success: (msg: string) => void; error: (msg: string) => void; info: (msg: string) => void; }} toast - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<Blob>} Datos efectivos después de ejecutar la operación.
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

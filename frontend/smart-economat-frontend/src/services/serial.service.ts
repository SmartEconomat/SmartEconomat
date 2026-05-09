/** Clase pública (SerialService). Paquete: smart-economat-frontend (SPA). */
export class SerialService {
  private port: SerialPort | null = null;
  private reader: ReadableStreamDefaultReader<string> | null = null;
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
  private buffer: string = '';

  private readonly STX = '\x02';
  private readonly ETX = '\x03';

  private readingLoopActive = false;

  /**
   * Expone "isSupported" en smart-economat-frontend (SPA).
   * @undefined {boolean} Datos efectivos después de ejecutar la operación.
   */
  public isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  /**
   * Obtiene valores o vistas materializadas.
   * @undefined {Promise<SerialPort[]>} Datos efectivos después de ejecutar la operación.
   */
  public async getAuthorizedPorts(): Promise<SerialPort[]> {
    if (!this.isSupported()) return [];
    return navigator.serial.getPorts();
  }

  /**
   * Expone "requestPort" en smart-economat-frontend (SPA).
   * @undefined {Promise<boolean>} Datos efectivos después de ejecutar la operación.
   */
  public async requestPort(): Promise<boolean> {
    if (!this.isSupported()) return false;

    try {
      this.port = await navigator.serial.requestPort();
      return true;
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'name' in error &&
        error.name === 'NotFoundError'
      ) {
        return false;
      }

      console.error('Error solicitando el puerto serie:', error);
      return false;
    }
  }

  /**
   * Expone "useAuthorizedPort" en smart-economat-frontend (SPA).
   * @undefined {Promise<boolean>} Datos efectivos después de ejecutar la operación.
   */
  public async useAuthorizedPort(): Promise<boolean> {
    const ports = await this.getAuthorizedPorts();
    if (ports.length === 0) return false;

    this.port = ports[0];
    return true;
  }

  /**
   * Expone "isConnected" en smart-economat-frontend (SPA).
   * @undefined {boolean} Datos efectivos después de ejecutar la operación.
   */
  public isConnected(): boolean {
    return Boolean(this.port?.readable && this.port?.writable);
  }

  /**
   * Garantiza la existencia, coherencia o validez del recurso indicado.
   * @undefined {Promise<boolean>} Datos efectivos después de ejecutar la operación.
   */
  public async ensureConnection(): Promise<boolean> {
    if (!this.port) {
      const hasPort = await this.useAuthorizedPort();
      if (!hasPort) return false;
    }

    try {
      await this.connect();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Expone "connect" en smart-economat-frontend (SPA).
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
   */
  public async connect(): Promise<void> {
    if (!this.port) throw new Error('No hay un puerto serie seleccionado.');

    if (!this.port.readable || !this.port.writable) {
      await this.port.open({
        baudRate: 9600,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
        flowControl: 'none',
      });
    }

    if (!this.port.readable || !this.port.writable) {
      throw new Error(
        'El puerto serie no está disponible para lectura/escritura.'
      );
    }

    // Convertimos datos binarios a texto
    if (!this.reader) {
      const decoder = new TextDecoderStream();
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      this.port.readable.pipeTo(decoder.writable).catch(() => {});
      this.reader = decoder.readable.getReader();
    }
  }

  private extractFrames(buf: string): [string[], string] {
    const frames: string[] = [];

    while (true) {
      // 1) Buscar STX
      const i = buf.indexOf(this.STX);

      if (i !== -1) {
        // Eliminar todo antes del STX
        buf = buf.slice(i + 1);

        // Buscar ETX
        const j = buf.indexOf(this.ETX);

        // Si no hay ETX aún -> trama incompleta
        if (j === -1) return [frames, this.STX + buf];

        // Extraer contenido entre STX y ETX
        frames.push(buf.slice(0, j));

        // Eliminar la trama procesada del buffer
        buf = buf.slice(j + 1);
        continue;
      }

      // 2) Intentar separar por salto de línea \n
      const newLineIndex = buf.indexOf('\n');
      if (newLineIndex !== -1) {
        frames.push(buf.slice(0, newLineIndex));
        buf = buf.slice(newLineIndex + 1);
        continue;
      }

      // 3) Intentar separar por \r
      const carriageReturnIndex = buf.indexOf('\r');
      if (carriageReturnIndex !== -1) {
        frames.push(buf.slice(0, carriageReturnIndex));
        buf = buf.slice(carriageReturnIndex + 1);
        continue;
      }

      return [frames, buf];
    }
  }

  private parseWeight(text: string): number | null {
    const matches = text.match(/[-+]?\d+(?:\.\d+)?/g);
    if (!matches || matches.length === 0) return null;

    const weight = Number.parseFloat(matches[matches.length - 1]);
    return Number.isNaN(weight) ? null : weight;
  }

  /**
   * Expone "restartContinuousRead" en smart-economat-frontend (SPA).
   * @undefined {(weight: number) => void} onWeight - Entrada efectiva esperada por el contrato.
   * @undefined {((error: Error) => void) | undefined} onError - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
   */
  public async restartContinuousRead(
    onWeight: (weight: number) => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    this.stopContinuousRead();
    await delay(75);
    void this.startContinuousRead(onWeight, onError);
  }

  /**
   * Inicia un flujo, watcher o proceso de largo recorrido.
   * @undefined {(weight: number) => void} onWeight - Entrada efectiva esperada por el contrato.
   * @undefined {((error: Error) => void) | undefined} onError - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
   */
  public async startContinuousRead(
    onWeight: (weight: number) => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    if (!this.reader) {
      throw new Error('La báscula no está conectada o no hay lector activo.');
    }

    if (this.readingLoopActive) return;

    this.readingLoopActive = true;
    let ultimoPesoDetectado: number | null = null;

    while (this.readingLoopActive) {
      try {
        const { value, done } = await this.reader.read();

        if (done) {
          this.readingLoopActive = false;
          break;
        }

        if (value) {
          this.buffer += value;
          const [frames, rest] = this.extractFrames(this.buffer);
          this.buffer = rest;

          for (const frame of frames) {
            const weight = this.parseWeight(frame.trim());
            if (weight !== null && weight !== ultimoPesoDetectado) {
              ultimoPesoDetectado = weight;
              onWeight(weight);
            }
          }
        }
      } catch (error: unknown) {
        if (this.readingLoopActive) {
          console.error('Error leyendo báscula:', error);
          if (onError && error instanceof Error) {
            onError(error);
          }
          await delay(200);
        }
      }
    }
  }

  /**
   * Detiene un flujo o libera procesos relacionados.
   * @undefined {void} Datos efectivos después de ejecutar la operación.
   */
  public stopContinuousRead(): void {
    this.readingLoopActive = false;
  }

  /**
   * Expone "disconnect" en smart-economat-frontend (SPA).
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
   */
  public async disconnect(): Promise<void> {
    try {
      this.stopContinuousRead();

      if (this.reader) {
        try {
          await this.reader.cancel();
        } catch {
          // noop
        }
        this.reader.releaseLock();
        this.reader = null;
      }

      if (this.writer) {
        try {
          await this.writer.abort();
        } catch {
          // noop
        }
        this.writer.releaseLock();
        this.writer = null;
      }

      if (this.port?.readable || this.port?.writable) {
        await this.port.close();
      }

      this.port = null;
      this.buffer = '';
    } catch (error) {
      console.error('Error cerrando el puerto serie:', error);
    }
  }
}

/**
 * Expone "delay" en smart-economat-frontend (SPA).
 * @undefined {number} ms - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
 */
export const delay = (ms: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, ms));

/** Constantes públicas (serialService) expuestas en smart-economat-frontend (SPA). */
export const serialService = new SerialService();

export class SerialService {
  private port: SerialPort | null = null;
  private reader: ReadableStreamDefaultReader<
    Uint8Array<ArrayBufferLike>
  > | null = null;
  private writer: WritableStreamDefaultWriter<
    Uint8Array<ArrayBufferLike>
  > | null = null;
  private buffer: Uint8Array<ArrayBufferLike> = new Uint8Array(0);

  private readonly STX = 0x02;
  private readonly ETX = 0x03;

  private readonly decoder = new TextDecoder();
  private readonly encoder = new TextEncoder();

  private readingLoopActive = false;
  private writeTimer: number | null = null;

  public isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  public async getAuthorizedPorts(): Promise<SerialPort[]> {
    if (!this.isSupported()) return [];
    return navigator.serial.getPorts();
  }

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

  public async useAuthorizedPort(): Promise<boolean> {
    const ports = await this.getAuthorizedPorts();
    if (ports.length === 0) return false;

    this.port = ports[0];
    return true;
  }

  public isConnected(): boolean {
    return Boolean(this.port?.readable && this.port?.writable);
  }

  public async ensureConnection(): Promise<boolean> {
    if (!this.port) {
      const hasPort = await this.useAuthorizedPort();
      if (!hasPort) return false;
    }

    if (this.port?.readable && this.port?.writable) {
      if (!this.reader) {
        this.reader = this.port.readable.getReader();
      }

      if (!this.writer) {
        this.writer = this.port.writable.getWriter();
      }

      return true;
    }

    await this.connect();
    return true;
  }

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

    if (!this.reader) {
      this.reader = this.port.readable.getReader();
    }

    if (!this.writer) {
      this.writer = this.port.writable.getWriter();
    }
  }

  private concatBuffer(
    a: Uint8Array<ArrayBufferLike>,
    b: Uint8Array<ArrayBufferLike>
  ): Uint8Array<ArrayBufferLike> {
    const result = new Uint8Array(a.length + b.length);
    result.set(a, 0);
    result.set(b, a.length);
    return result;
  }

  private extractFrames(buf: Uint8Array): {
    frames: Uint8Array<ArrayBufferLike>[];
    rest: Uint8Array<ArrayBufferLike>;
  } {
    const frames: Uint8Array<ArrayBufferLike>[] = [];
    let buffer = buf;

    while (true) {
      const stxIndex = buffer.indexOf(this.STX);
      if (stxIndex !== -1) {
        buffer = buffer.slice(stxIndex + 1);
        const etxIndex = buffer.indexOf(this.ETX);

        if (etxIndex === -1) {
          return {
            frames,
            rest: this.concatBuffer(new Uint8Array([this.STX]), buffer),
          };
        }

        frames.push(buffer.slice(0, etxIndex));
        buffer = buffer.slice(etxIndex + 1);
        continue;
      }

      const newLineIndex = buffer.indexOf(10);
      if (newLineIndex !== -1) {
        frames.push(buffer.slice(0, newLineIndex));
        buffer = buffer.slice(newLineIndex + 1);
        continue;
      }

      const carriageReturnIndex = buffer.indexOf(13);
      if (carriageReturnIndex !== -1) {
        frames.push(buffer.slice(0, carriageReturnIndex));
        buffer = buffer.slice(carriageReturnIndex + 1);
        continue;
      }

      return { frames, rest: buffer };
    }
  }

  private parseWeight(text: string): number | null {
    const matches = text.match(/[-+]?\d+(?:\.\d+)?/g);
    if (!matches || matches.length === 0) return null;

    const weight = Number.parseFloat(matches[matches.length - 1]);
    return Number.isNaN(weight) ? null : weight;
  }

  public async restartContinuousRead(
    onWeight: (weight: number) => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    this.stopContinuousRead();
    await delay(75);
    void this.startContinuousRead(onWeight, onError);
  }

  public async startContinuousRead(
    onWeight: (weight: number) => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    if (!this.reader || !this.writer) {
      throw new Error('La báscula no está conectada.');
    }

    if (this.readingLoopActive) return;

    this.readingLoopActive = true;

    if (this.writeTimer !== null) {
      window.clearInterval(this.writeTimer);
    }
    this.writeTimer = window.setInterval(() => {
      if (this.writer && this.readingLoopActive) {
        this.writer.write(this.encoder.encode('P\r\n')).catch(() => {});
      }
    }, 400);

    while (this.readingLoopActive) {
      try {
        const { value, done } = await this.reader.read();

        if (done) {
          this.readingLoopActive = false;
          break;
        }

        if (value) {
          this.buffer = this.concatBuffer(this.buffer, value);
          const { frames, rest } = this.extractFrames(this.buffer);
          this.buffer = rest;

          for (const frame of frames) {
            const text = this.decoder.decode(frame).trim();
            const weight = this.parseWeight(text);
            if (weight !== null) {
              onWeight(weight);
            }
          }
        }
      } catch (error: unknown) {
        const serialError =
          error instanceof Error
            ? error
            : new Error('Error leyendo datos desde la báscula.');
        this.readingLoopActive = false;
        onError?.(serialError);
      }

      if (this.readingLoopActive) {
        await delay(50);
      }
    }
  }

  public stopContinuousRead(): void {
    this.readingLoopActive = false;
    if (this.writeTimer !== null) {
      window.clearInterval(this.writeTimer);
      this.writeTimer = null;
    }
  }

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
      this.buffer = new Uint8Array(0);
    } catch (error) {
      console.error('Error cerrando el puerto serie:', error);
    }
  }
}

export const delay = (ms: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, ms));

export const serialService = new SerialService();

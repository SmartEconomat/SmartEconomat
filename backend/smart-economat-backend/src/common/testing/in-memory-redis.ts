/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
type StoredValue = {
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  value: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  expiresAt?: number;
};

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
type RedisSetMode = 'EX';

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
export type InMemoryRedisLike = {
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  status: string;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  get(key: string): Promise<string | null>;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  set(
    key: string,
    value: string,
    mode?: RedisSetMode,
    durationSeconds?: number
  ): Promise<'OK'>;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  del(key: string): Promise<number>;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  quit(): Promise<'OK'>;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  disconnect(reconnect?: boolean): void;
};

/**
 * Crea in memory redis client.
 * @returns Valor resultante de la operación.
 */
/**
 * Crea recursos nuevos en base a las reglas de negocio.
 * @undefined {InMemoryRedisLike} Datos efectivos después de ejecutar la operación.
 */
export function createInMemoryRedisClient(): InMemoryRedisLike {
  const store = new Map<string, StoredValue>();

  /**
   * Ejecuta la lógica de purge if expired dentro del flujo de la aplicación.
   *
   * @param key Parámetro de entrada para la operación.
   */
  const purgeIfExpired = (key: string): void => {
    const entry = store.get(key);
    if (!entry) return;

    if (entry.expiresAt && entry.expiresAt <= Date.now()) {
      store.delete(key);
    }
  };

  return {
    status: 'ready',

    get(key: string): Promise<string | null> {
      purgeIfExpired(key);
      return Promise.resolve(store.get(key)?.value ?? null);
    },

    set(
      key: string,
      value: string,
      mode?: RedisSetMode,
      durationSeconds?: number
    ): Promise<'OK'> {
      const entry: StoredValue = { value };

      if (mode === 'EX' && typeof durationSeconds === 'number') {
        entry.expiresAt = Date.now() + durationSeconds * 1000;
      }

      store.set(key, entry);
      return Promise.resolve('OK');
    },

    del(key: string): Promise<number> {
      return Promise.resolve(store.delete(key) ? 1 : 0);
    },

    quit(): Promise<'OK'> {
      store.clear();
      this.status = 'end';
      return Promise.resolve('OK');
    },

    disconnect(): void {
      store.clear();
      this.status = 'end';
    },
  };
}

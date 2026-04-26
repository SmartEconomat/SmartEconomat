/**
 * Documentación en español.
 */

/**
 * Documentación en español.
 */
type StoredValue = {
        /**
     * Documentación en español.
     */
  value: string;
        /**
     * Documentación en español.
     */
  expiresAt?: number;
};

/**
 * Documentación en español.
 */
type RedisSetMode = 'EX';

/**
 * Documentación en español.
 */
export type InMemoryRedisLike = {
        /**
     * Documentación en español.
     */
  status: string;

        /**
     * Documentación en español.
     */
  get(key: string): Promise<string | null>;

        /**
     * Documentación en español.
     */
  set(
    key: string,
    value: string,
    mode?: RedisSetMode,
    durationSeconds?: number
  ): Promise<'OK'>;

        /**
     * Documentación en español.
     */
  del(key: string): Promise<number>;

        /**
     * Documentación en español.
     */
  quit(): Promise<'OK'>;

        /**
     * Documentación en español.
     */
  disconnect(reconnect?: boolean): void;
};

/**
 * Documentación en español.
 */
export function createInMemoryRedisClient(): InMemoryRedisLike {
  const store = new Map<string, StoredValue>();

        /**
     * Documentación en español.
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

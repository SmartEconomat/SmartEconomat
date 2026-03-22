type StoredValue = {
  value: string;
  expiresAt?: number;
};

type RedisSetMode = 'EX';

export type InMemoryRedisLike = {
  status: string;
  get(key: string): Promise<string | null>;
  set(
    key: string,
    value: string,
    mode?: RedisSetMode,
    durationSeconds?: number
  ): Promise<'OK'>;
  del(key: string): Promise<number>;
  quit(): Promise<'OK'>;
  disconnect(reconnect?: boolean): void;
};

export function createInMemoryRedisClient(): InMemoryRedisLike {
  const store = new Map<string, StoredValue>();

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

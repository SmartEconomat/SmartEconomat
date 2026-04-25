/**
 * @module InMemoryRedis
 * Lightweight in-memory Redis-compatible client used in unit/integration tests
 * to avoid requiring a real Redis instance. Implements the subset of the Redis API
 * that SmartEconomat uses (get, set with optional EX TTL, del, quit, disconnect).
 *
 * @example
 * const redis = createInMemoryRedisClient();
 * await redis.set('key', 'value', 'EX', 60);
 * const val = await redis.get('key');
 * await redis.quit();
 */

/**
 * Internal shape of a stored value including an optional expiry timestamp.
 * @private
 */
type StoredValue = {
  /** The serialised string value. */
  value: string;
  /** Unix ms timestamp after which the entry is considered expired, if set. */
  expiresAt?: number;
};

/**
 * Supported Redis SET mode.
 * Currently only `'EX'` (expire in seconds) is supported.
 */
type RedisSetMode = 'EX';

/**
 * Minimal Redis-like interface implemented by {@link createInMemoryRedisClient}.
 * Compatible with the `ioredis` client API subset used by `@nestjs/throttler`.
 */
export type InMemoryRedisLike = {
  /** Current connection status. `'ready'` when operational, `'end'` after disconnection. */
  status: string;

  /**
   * Retrieves the value for a given key, respecting TTL expiry.
   *
   * @param {string} key - The key to look up.
   * @returns {Promise<string | null>} The stored value, or `null` if not found or expired.
   */
  get(key: string): Promise<string | null>;

  /**
   * Stores a key-value pair with an optional TTL.
   *
   * @param {string} key                  - The key to set.
   * @param {string} value                - The value to store.
   * @param {RedisSetMode} [mode]         - Optional mode; only `'EX'` is recognised.
   * @param {number} [durationSeconds]    - Time-to-live in seconds (requires `mode = 'EX'`).
   * @returns {Promise<'OK'>} Always resolves to `'OK'`.
   */
  set(
    key: string,
    value: string,
    mode?: RedisSetMode,
    durationSeconds?: number
  ): Promise<'OK'>;

  /**
   * Deletes a key from the store.
   *
   * @param {string} key - The key to delete.
   * @returns {Promise<number>} `1` if the key existed and was deleted, `0` otherwise.
   */
  del(key: string): Promise<number>;

  /**
   * Clears all entries and marks the connection as ended.
   *
   * @returns {Promise<'OK'>} Always resolves to `'OK'`.
   */
  quit(): Promise<'OK'>;

  /**
   * Clears all entries and marks the connection as ended synchronously.
   *
   * @param {boolean} [reconnect] - Unused; present for API compatibility.
   */
  disconnect(reconnect?: boolean): void;
};

/**
 * Factory that creates an in-memory Redis-compatible client backed by a `Map`.
 *
 * Entries with an `EX` TTL are lazily purged on access rather than via a background timer,
 * making the implementation deterministic and side-effect-free in test environments.
 *
 * @returns {InMemoryRedisLike} A new isolated in-memory Redis client instance.
 */
export function createInMemoryRedisClient(): InMemoryRedisLike {
  const store = new Map<string, StoredValue>();

  /**
   * Removes an entry from the store if its TTL has elapsed.
   *
   * @param {string} key - The key to check and purge if expired.
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

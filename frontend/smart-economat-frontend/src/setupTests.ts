import '@testing-library/jest-dom/vitest';
import 'wicg-inert';
// Initialize i18n so that t() calls in components return real translations
// (Spanish by default) instead of raw keys during Vitest runs.
import i18n from './i18n';

// Force Spanish for tests to match expectations
void i18n.changeLanguage('es');

function createMemoryStorage(): Storage {
  const data = new Map<string, string>();

  return {
    get length() {
      return data.size;
    },
    clear() {
      data.clear();
    },
    getItem(key: string) {
      return data.has(key) ? data.get(key)! : null;
    },
    key(index: number) {
      return Array.from(data.keys())[index] ?? null;
    },
    removeItem(key: string) {
      data.delete(key);
    },
    setItem(key: string, value: string) {
      data.set(String(key), String(value));
    },
  };
}

function hasStorageApi(candidate: unknown): candidate is Storage {
  if (!candidate || typeof candidate !== 'object') {
    return false;
  }

  const storageLike = candidate as Partial<Storage>;
  return (
    typeof storageLike.getItem === 'function' &&
    typeof storageLike.setItem === 'function' &&
    typeof storageLike.removeItem === 'function' &&
    typeof storageLike.clear === 'function'
  );
}

// En algunos entornos Node+Vitest (Node 22), localStorage puede existir sin la API completa.
// Si falta, forzamos un Storage en memoria estable para evitar fallos intermitentes.
const normalizedStorage = hasStorageApi(globalThis.localStorage)
  ? globalThis.localStorage
  : createMemoryStorage();

if (!hasStorageApi(globalThis.localStorage)) {
  Object.defineProperty(globalThis, 'localStorage', {
    value: normalizedStorage,
    writable: true,
    configurable: true,
  });
}

if (typeof window !== 'undefined' && !hasStorageApi(window.localStorage)) {
  Object.defineProperty(window, 'localStorage', {
    value: normalizedStorage,
    writable: true,
    configurable: true,
  });
}

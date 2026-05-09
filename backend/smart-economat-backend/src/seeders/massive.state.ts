import { SeedContext } from './seed-context';

/**
 * Obtiene valores o vistas materializadas.
 * @undefined {SeedContext} context - Entrada efectiva esperada por el contrato.
 * @undefined {string} key - Entrada efectiva esperada por el contrato.
 * @undefined {string[]} Datos efectivos después de ejecutar la operación.
 */
export function getStateArray(context: SeedContext, key: string): string[] {
  return context.getState<string[]>(key) || [];
}

/**
 * Establece referencias mutables internas del componente/servicio.
 * @undefined {SeedContext} context - Entrada efectiva esperada por el contrato.
 * @undefined {string} key - Entrada efectiva esperada por el contrato.
 * @undefined {string[]} values - Entrada efectiva esperada por el contrato.
 * @undefined {void} Datos efectivos después de ejecutar la operación.
 */
export function setStateArray(
  context: SeedContext,
  key: string,
  values: string[]
): void {
  context.set(key, values);
}

/**
 * Expone "pushStateValue" en smart-economat-backend (Nest).
 * @undefined {SeedContext} context - Entrada efectiva esperada por el contrato.
 * @undefined {string} key - Entrada efectiva esperada por el contrato.
 * @undefined {unknown} value - Entrada efectiva esperada por el contrato.
 * @undefined {void} Datos efectivos después de ejecutar la operación.
 */
export function pushStateValue(
  context: SeedContext,
  key: string,
  value: unknown
): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return;
  }

  const current = getStateArray(context, key);
  if (!current.includes(value)) {
    current.push(value);
    setStateArray(context, key, current);
  }
}

/**
 * Expone "removeStateValue" en smart-economat-backend (Nest).
 * @undefined {SeedContext} context - Entrada efectiva esperada por el contrato.
 * @undefined {string} key - Entrada efectiva esperada por el contrato.
 * @undefined {string} value - Entrada efectiva esperada por el contrato.
 * @undefined {void} Datos efectivos después de ejecutar la operación.
 */
export function removeStateValue(
  context: SeedContext,
  key: string,
  value: string
): void {
  const current = getStateArray(context, key);
  if (current.length === 0) {
    return;
  }

  setStateArray(
    context,
    key,
    current.filter((item) => item !== value)
  );
}

/**
 * Expone "consumeStateValue" en smart-economat-backend (Nest).
 * @undefined {SeedContext} context - Entrada efectiva esperada por el contrato.
 * @undefined {string} key - Entrada efectiva esperada por el contrato.
 * @undefined {string} fallback - Entrada efectiva esperada por el contrato.
 * @undefined {string} Datos efectivos después de ejecutar la operación.
 */
export function consumeStateValue(
  context: SeedContext,
  key: string,
  fallback = ''
): string {
  const current = getStateArray(context, key);
  while (current.length > 0) {
    const candidate = current.shift();
    if (candidate && candidate.trim().length > 0) {
      setStateArray(context, key, current);
      return candidate;
    }
  }

  setStateArray(context, key, current);
  return fallback;
}

/**
 * Expone "consumeRequiredStateValue" en smart-economat-backend (Nest).
 * @undefined {SeedContext} context - Entrada efectiva esperada por el contrato.
 * @undefined {string} key - Entrada efectiva esperada por el contrato.
 * @undefined {string} Datos efectivos después de ejecutar la operación.
 */
export function consumeRequiredStateValue(
  context: SeedContext,
  key: string
): string {
  const value = consumeStateValue(context, key, '');
  if (!value) {
    throw new Error(
      `[seed-massive] No hay IDs disponibles en estado "${key}" para consumir`
    );
  }
  return value;
}

/**
 * Expone "pickStateValue" en smart-economat-backend (Nest).
 * @undefined {SeedContext} context - Entrada efectiva esperada por el contrato.
 * @undefined {string} key - Entrada efectiva esperada por el contrato.
 * @undefined {number} iteration - Entrada efectiva esperada por el contrato.
 * @undefined {string} fallback - Entrada efectiva esperada por el contrato.
 * @undefined {number} offset - Entrada efectiva esperada por el contrato.
 * @undefined {string} Datos efectivos después de ejecutar la operación.
 */
export function pickStateValue(
  context: SeedContext,
  key: string,
  iteration: number,
  fallback = '',
  offset = 0
): string {
  const values = getStateArray(context, key);
  if (values.length === 0) {
    return fallback;
  }

  const idx = (iteration + offset) % values.length;
  return values[idx] || fallback;
}

/**
 * Expone "pickRequiredStateValue" en smart-economat-backend (Nest).
 * @undefined {SeedContext} context - Entrada efectiva esperada por el contrato.
 * @undefined {string} key - Entrada efectiva esperada por el contrato.
 * @undefined {number} iteration - Entrada efectiva esperada por el contrato.
 * @undefined {number} offset - Entrada efectiva esperada por el contrato.
 * @undefined {string} Datos efectivos después de ejecutar la operación.
 */
export function pickRequiredStateValue(
  context: SeedContext,
  key: string,
  iteration: number,
  offset = 0
): string {
  const value = pickStateValue(context, key, iteration, '', offset);
  if (!value) {
    throw new Error(
      `[seed-massive] No hay IDs disponibles en estado "${key}" para seleccionar`
    );
  }
  return value;
}

/**
 * Obtiene valores o vistas materializadas.
 * @undefined {SeedContext} context - Entrada efectiva esperada por el contrato.
 * @undefined {string} key - Entrada efectiva esperada por el contrato.
 * @undefined {string} Datos efectivos después de ejecutar la operación.
 */
export function getRequiredStateString(
  context: SeedContext,
  key: string
): string {
  const value = context.getState<string>(key);
  if (!value || value.trim().length === 0) {
    throw new Error(`[seed-massive] Falta valor requerido en estado "${key}"`);
  }
  return value;
}

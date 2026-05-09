import path from "node:path";

/** Constantes exportadas (ALLOWED_SERVICES) compartidas por el instalador. */
export const ALLOWED_SERVICES = ["frontend", "backend", "db", "redis"] as const;

/** Constantes exportadas (DANGER_CONFIRMATION_PHRASE) compartidas por el instalador. */
export const DANGER_CONFIRMATION_PHRASE = "CONFIRMAR";

/** Alias de tipo público (AllowedService). */
export type AllowedService = (typeof ALLOWED_SERVICES)[number];

const SAFE_TEXT_REGEX = /^[A-Za-z0-9._\-/:\\ ]+$/;

/**
 * Expone la operación "assertAllowedService" del instalador SmartEconomat.
 * @param {string} service - Entrada esperada por la función.
 * @returns {void} Resultado efectivo tras la llamada (puede incluir Promesas).
 */
export function assertAllowedService(
  service: string,
): asserts service is AllowedService {
  if (!ALLOWED_SERVICES.includes(service as AllowedService)) {
    throw new Error(`Servicio no permitido: ${service}`);
  }
}

/**
 * Expone la operación "assertSafeText" del instalador SmartEconomat.
 * @param {string} value - Entrada esperada por la función.
 * @param {string} fieldName - Entrada esperada por la función.
 * @returns {void} Resultado efectivo tras la llamada (puede incluir Promesas).
 */
export function assertSafeText(value: string, fieldName: string): void {
  if (!SAFE_TEXT_REGEX.test(value)) {
    throw new Error(`Valor inseguro en ${fieldName}`);
  }
}

/**
 * Expone la operación "assertRuntimePath" del instalador SmartEconomat.
 * @param {string} runtimePath - Entrada esperada por la función.
 * @returns {string} Resultado efectivo tras la llamada (puede incluir Promesas).
 */
export function assertRuntimePath(runtimePath: string): string {
  if (!path.isAbsolute(runtimePath)) {
    throw new Error("runtimePath debe ser absoluto");
  }

  assertSafeText(runtimePath, "runtimePath");
  return runtimePath;
}

/**
 * Expone la operación "assertDangerConfirmation" del instalador SmartEconomat.
 * @param {string} value - Entrada esperada por la función.
 * @returns {void} Resultado efectivo tras la llamada (puede incluir Promesas).
 */
export function assertDangerConfirmation(value: string): void {
  if (value.trim().toUpperCase() !== DANGER_CONFIRMATION_PHRASE) {
    throw new Error("Confirmación inválida para acción destructiva");
  }
}

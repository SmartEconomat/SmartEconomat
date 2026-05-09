/**
 * Expone la operación "computeBackoffInterval" del instalador SmartEconomat.
 * @param {number} baseIntervalMs - Entrada esperada por la función.
 * @param {number} maxIntervalMs - Entrada esperada por la función.
 * @param {number} consecutiveFailures - Entrada esperada por la función.
 * @returns {number} Resultado efectivo tras la llamada (puede incluir Promesas).
 */
export function computeBackoffInterval(
  baseIntervalMs: number,
  maxIntervalMs: number,
  consecutiveFailures: number,
): number {
  if (consecutiveFailures <= 0) {
    return baseIntervalMs;
  }
  const exponentialDelay = baseIntervalMs * Math.pow(2, consecutiveFailures);
  return Math.min(exponentialDelay, maxIntervalMs);
}

/**
 * Expone la operación "shouldRunRecovery" del instalador SmartEconomat.
 * @param {number} nowMs - Entrada esperada por la función.
 * @param {number} lastRecoveryAttemptAtMs - Entrada esperada por la función.
 * @param {number} cooldownMs - Entrada esperada por la función.
 * @returns {boolean} Resultado efectivo tras la llamada (puede incluir Promesas).
 */
export function shouldRunRecovery(
  nowMs: number,
  lastRecoveryAttemptAtMs: number,
  cooldownMs: number,
): boolean {
  if (lastRecoveryAttemptAtMs <= 0) {
    return true;
  }
  return nowMs - lastRecoveryAttemptAtMs >= cooldownMs;
}

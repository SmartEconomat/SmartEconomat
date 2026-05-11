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

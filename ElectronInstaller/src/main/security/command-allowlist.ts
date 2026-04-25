import path from "node:path";

export const ALLOWED_SERVICES = ["frontend", "backend", "db", "redis"] as const;

export const DANGER_CONFIRMATION_PHRASE = "CONFIRMAR";

export type AllowedService = (typeof ALLOWED_SERVICES)[number];

const SAFE_TEXT_REGEX = /^[A-Za-z0-9._\-/:\\ ]+$/;

export function assertAllowedService(
  service: string,
): asserts service is AllowedService {
  if (!ALLOWED_SERVICES.includes(service as AllowedService)) {
    throw new Error(`Servicio no permitido: ${service}`);
  }
}

export function assertSafeText(value: string, fieldName: string): void {
  if (!SAFE_TEXT_REGEX.test(value)) {
    throw new Error(`Valor inseguro en ${fieldName}`);
  }
}

export function assertRuntimePath(runtimePath: string): string {
  if (!path.isAbsolute(runtimePath)) {
    throw new Error("runtimePath debe ser absoluto");
  }

  assertSafeText(runtimePath, "runtimePath");
  return runtimePath;
}

export function assertDangerConfirmation(value: string): void {
  if (value.trim().toUpperCase() !== DANGER_CONFIRMATION_PHRASE) {
    throw new Error("Confirmación inválida para acción destructiva");
  }
}

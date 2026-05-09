import crypto from "node:crypto";

/** Servicio del proceso principal: SecretStoreService. */
export class SecretStoreService {
  /**
   * Genera artefactos o informes solicitados.
   * @param {number} length - Entrada esperada por la función.
   * @returns {string} Resultado efectivo tras la llamada (puede incluir Promesas).
   */
  generateSecret(length: number): string {
    const byteLength = Math.ceil(length / 2);
    return crypto.randomBytes(byteLength).toString("hex").slice(0, length);
  }

  /**
   * Expone la operación "maskValue" del instalador SmartEconomat.
   * @param {string} value - Entrada esperada por la función.
   * @returns {string} Resultado efectivo tras la llamada (puede incluir Promesas).
   */
  maskValue(value: string): string {
    if (value.length <= 6) {
      return "***";
    }
    return `${value.slice(0, 3)}***${value.slice(-3)}`;
  }

  /**
   * Expone la operación "maskText" del instalador SmartEconomat.
   * @param {string} text - Entrada esperada por la función.
   * @param {string[]} secrets - Entrada esperada por la función.
   * @returns {string} Resultado efectivo tras la llamada (puede incluir Promesas).
   */
  maskText(text: string, secrets: string[]): string {
    return secrets
      .filter((secret) => secret.length > 0)
      .reduce(
        (safeText, secret) =>
          safeText.split(secret).join(this.maskValue(secret)),
        text,
      );
  }
}

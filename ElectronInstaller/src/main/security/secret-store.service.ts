import crypto from "node:crypto";

export class SecretStoreService {
  generateSecret(length: number): string {
    const byteLength = Math.ceil(length / 2);
    return crypto.randomBytes(byteLength).toString("hex").slice(0, length);
  }

  maskValue(value: string): string {
    if (value.length <= 6) {
      return "***";
    }
    return `${value.slice(0, 3)}***${value.slice(-3)}`;
  }

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

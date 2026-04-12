const DEVELOPMENT_ENV = 'development';

function normalizeEnv(value: string | undefined): string {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();

  return normalized.length > 0 ? normalized : DEVELOPMENT_ENV;
}

export function assertDevelopmentSeedEnvironment(origin: string): void {
  const nodeEnv = normalizeEnv(process.env.NODE_ENV);
  process.env.NODE_ENV = nodeEnv;

  if (nodeEnv !== DEVELOPMENT_ENV) {
    throw new Error(
      `[${origin}] Seeders bloqueados: solo se permite ejecucion con NODE_ENV=development (actual: NODE_ENV=${nodeEnv}).`
    );
  }
}

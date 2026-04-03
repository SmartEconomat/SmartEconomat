const DEVELOPMENT_ENV = 'development';

function normalizeEnv(value: string | undefined): string {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();

  return normalized.length > 0 ? normalized : DEVELOPMENT_ENV;
}

function normalizeOptionalValue(value: string | undefined): string {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function looksLikeProductionDatabase(databaseName: string): boolean {
  return /(prod|production)/i.test(databaseName);
}

export function assertDevelopmentSeedEnvironment(origin: string): void {
  const nodeEnv = normalizeEnv(process.env.NODE_ENV);
  process.env.NODE_ENV = nodeEnv;

  const databaseName = normalizeOptionalValue(
    process.env.DB_DATABASE || process.env.POSTGRES_DB
  );

  const blockers: string[] = [];

  if (nodeEnv !== DEVELOPMENT_ENV) {
    blockers.push(`NODE_ENV=${nodeEnv}`);
  }

  if (databaseName && looksLikeProductionDatabase(databaseName)) {
    blockers.push(`DB_DATABASE=${databaseName}`);
  }

  if (blockers.length > 0) {
    throw new Error(
      `[${origin}] Seeders bloqueados: solo se permite ejecucion en desarrollo (${blockers.join(', ')}).`
    );
  }
}

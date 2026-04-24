const DEVELOPMENT_ENV = 'development';
const PRODUCTION_ENV = 'production';

function normalizeEnv(value: string | undefined): string {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();

  return normalized.length > 0 ? normalized : DEVELOPMENT_ENV;
}

function hasForceProductionFlag(): boolean {
  return process.argv.includes('--force-production');
}

export function assertDevelopmentSeedEnvironment(origin: string): void {
  const nodeEnv = normalizeEnv(process.env.NODE_ENV);
  process.env.NODE_ENV = nodeEnv;

  if (nodeEnv === DEVELOPMENT_ENV) {
    return;
  }

  if (nodeEnv === PRODUCTION_ENV && hasForceProductionFlag()) {
    console.warn(
      `[${origin}] Forzando ejecucion de seeders en produccion (NODE_ENV=${nodeEnv}) por flag --force-production.`
    );
    return;
  }

  throw new Error(
    `[${origin}] Seeders bloqueados: solo se permite ejecucion con NODE_ENV=development (actual: NODE_ENV=${nodeEnv}). Para forzar conscientemente en produccion, usa NODE_ENV=production npm run seed -- --force-production.`
  );
}

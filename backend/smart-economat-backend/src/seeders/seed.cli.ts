import 'reflect-metadata';
import { assertDevelopmentSeedEnvironment } from './seed-environment.guard';

type SeedCliArgs = {
  multiplier: number;
  forceProduction: boolean;
};

function parseCliArgs(argv: string[]): SeedCliArgs {
  const args = argv.slice(2);
  let multiplier = 1;
  let hasMultiplier = false;
  let forceProduction = false;

  for (const rawArg of args) {
    const arg = rawArg.trim();
    if (!arg) {
      continue;
    }

    if (arg === '--force-production') {
      forceProduction = true;
      continue;
    }

    if (arg.startsWith('--')) {
      console.warn(`[seed-cli] Argumento no reconocido "${arg}". Se ignorara.`);
      continue;
    }

    if (hasMultiplier) {
      console.warn(`[seed-cli] Argumento posicional extra "${arg}" ignorado.`);
      continue;
    }

    const parsed = Number.parseInt(arg, 10);
    if (Number.isNaN(parsed) || parsed < 1) {
      console.warn(
        `[seed-cli] Multiplicador invalido "${arg}". Se usara el valor por defecto 1.`
      );
      hasMultiplier = true;
      continue;
    }

    multiplier = parsed;
    hasMultiplier = true;
  }

  return {
    multiplier,
    forceProduction,
  };
}

async function run(): Promise<void> {
  const { multiplier, forceProduction } = parseCliArgs(process.argv);

  if (forceProduction) {
    console.warn(
      '[seed-cli] Flag --force-production detectado: se permitira seed en NODE_ENV=production.'
    );
  }

  assertDevelopmentSeedEnvironment('seed-cli');
  process.env.SEED_MULTIPLIER = String(multiplier);
  process.env.IS_SEEDING = 'true';

  console.log(`[seed-cli] Ejecutando seed con multiplicador=${multiplier}`);

  const { runMassiveSeeder } =
    require('./massive') as typeof import('./massive');
  await runMassiveSeeder();
}

if (require.main === module) {
  void run()
    .then(() => {
      console.log('[seed-cli] Seeding completado exitosamente.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('[seed-cli] Ejecucion fallida:', error);
      process.exit(1);
    });
}

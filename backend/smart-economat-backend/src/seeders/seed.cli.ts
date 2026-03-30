import 'reflect-metadata';

function parsePositionalMultiplier(argv: string[]): number {
  const raw = argv[2];
  if (!raw) {
    return 1;
  }

  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    console.warn(
      `[seed-cli] Multiplicador invalido "${raw}". Se usara el valor por defecto 1.`
    );
    return 1;
  }

  return parsed;
}

async function run(): Promise<void> {
  const multiplier = parsePositionalMultiplier(process.argv);
  process.env.SEED_MULTIPLIER = String(multiplier);
  process.env.IS_SEEDING = 'true';

  console.log(`[seed-cli] Ejecutando seed con multiplicador=${multiplier}`);

  const { runMassiveSeeder } =
    require('./massive') as typeof import('./massive');
  await runMassiveSeeder();
}

if (require.main === module) {
  void run().catch((error) => {
    console.error('[seed-cli] Ejecucion fallida:', error);
    process.exit(1);
  });
}

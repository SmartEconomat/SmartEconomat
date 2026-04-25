import 'reflect-metadata';
import { assertDevelopmentSeedEnvironment } from './seed-environment.guard';
import { runBootstrapAdminUsersSeed } from './bootstrap-admin-users.seed';

function hasForceProductionFlag(argv: string[]): boolean {
  return argv.includes('--force-production');
}

async function run(): Promise<void> {
  if (hasForceProductionFlag(process.argv)) {
    console.warn(
      '[bootstrap-admin-users.cli] Flag --force-production detectado: se permitira ejecutar el seeder bootstrap en NODE_ENV=production.'
    );
  }

  assertDevelopmentSeedEnvironment('bootstrap-admin-users.cli');
  process.env.IS_SEEDING = 'true';

  console.log(
    '[bootstrap-admin-users.cli] Ejecutando seeder bootstrap de admin/superadmin...'
  );
  await runBootstrapAdminUsersSeed();
}

if (require.main === module) {
  void run()
    .then(() => {
      console.log(
        '[bootstrap-admin-users.cli] Seeder bootstrap completado exitosamente.'
      );
      process.exit(0);
    })
    .catch((error) => {
      console.error('[bootstrap-admin-users.cli] Ejecucion fallida:', error);
      process.exit(1);
    });
}

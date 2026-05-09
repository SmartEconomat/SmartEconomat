import 'reflect-metadata';
import * as bcrypt from 'bcrypt';

import AppDataSource from '../config/typeorm.config';
import { assertDevelopmentSeedEnvironment } from './seed-environment.guard';

const CLI_TAG = '[reset-canonical-seed-passwords.cli]';

/** Usernames alineados con el seed masivo (`FIXED_SEED_*` en `massive.runtime.actors.ts`). */
const CANONICAL_SEED_USERNAMES = [
  'admin',
  'superadmin',
  'profesor',
  'alumno',
] as const;

function readPlainPassword(): string {
  const fromEnv =
    process.env.CANONICAL_SEED_USER_PASSWORD?.trim() ||
    process.env.SEED_DEFAULT_ADMIN_TEMP_PASSWORD?.trim() ||
    '';
  if (fromEnv.length > 0) {
    return fromEnv;
  }
  return 'SmartEconomat2026!';
}

async function run(): Promise<void> {
  assertDevelopmentSeedEnvironment('reset-canonical-seed-passwords.cli');
  const plain = readPlainPassword();
  const hash = await bcrypt.hash(plain, 10);

  const shouldDestroy = !AppDataSource.isInitialized;
  if (shouldDestroy) {
    await AppDataSource.initialize();
  }

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    for (const username of CANONICAL_SEED_USERNAMES) {
      const rows = (await queryRunner.query(
        `UPDATE "usuario"
         SET "password" = $1,
             "must_change_password" = FALSE,
             "resetPasswordOtp" = NULL,
             "resetPasswordOtpExpires" = NULL,
             "updated_at" = NOW()
         WHERE LOWER(TRIM("username")) = LOWER(TRIM($2))
         RETURNING "username"`,
        [hash, username]
      )) as Array<{ username?: string }>;

      if (rows.length === 0) {
        console.warn(
          `${CLI_TAG} No hay fila con username="${username}"; se omite.`
        );
      } else {
        console.log(
          `${CLI_TAG} Contraseña actualizada para usuario "${rows[0]?.username ?? username}".`
        );
      }
    }

    await queryRunner.commitTransaction();
    console.log(
      `${CLI_TAG} Completado. Contraseña en texto plano efectiva: (ver env CANONICAL_SEED_USER_PASSWORD / SEED_DEFAULT_ADMIN_TEMP_PASSWORD o valor por defecto documentado).`
    );
  } catch (error) {
    if (queryRunner.isTransactionActive) {
      await queryRunner.rollbackTransaction();
    }
    throw error;
  } finally {
    await queryRunner.release();
    if (shouldDestroy && AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

void run().catch((error) => {
  console.error(`${CLI_TAG} Fallo:`, error);
  process.exit(1);
});

/**
 * Shared guards for prod-bootstrap-runner (schema preconditions, env parsing).
 * Kept in plain CommonJS so the runner and Jest can load it without a build step.
 */

function parseBooleanEnv(value, defaultValue) {
  if (typeof value !== 'string') {
    return defaultValue;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
    return true;
  }

  if (normalized === 'false' || normalized === '0' || normalized === 'no') {
    return false;
  }

  return defaultValue;
}

/**
 * Ensures migrations have created the baseline schema before alignment SQL runs.
 * Prevents opaque PostgreSQL 42P01 errors (e.g. relation "purchase_batch" does not exist)
 * when STARTUP_RUN_MIGRATIONS=false on an empty database.
 *
 * @param {import('typeorm').DataSource} dataSource
 */
async function assertSchemaReadyForAlignment(dataSource) {
  const result = await dataSource.query(
    `SELECT EXISTS (
       SELECT 1
       FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_name = 'purchase_batch'
     ) AS "exists"`
  );

  const exists = Boolean(result[0]?.exists);
  if (exists) {
    return;
  }

  const migrationsSkipped = !parseBooleanEnv(
    process.env.STARTUP_RUN_MIGRATIONS,
    true
  );

  const hint = migrationsSkipped
    ? 'STARTUP_RUN_MIGRATIONS=false pero la base no tiene esquema aplicado. En la primera carga usá STARTUP_RUN_MIGRATIONS=true (o ejecutá migraciones manualmente) y reiniciá.'
    : 'Las migraciones deberían haber creado purchase_batch; revisá fallos en runMigrations y el contenido de la tabla migrations.';

  throw new Error(
    `[prod-bootstrap-runner] Esquema incompleto: falta la tabla public.purchase_batch. ${hint}`
  );
}

module.exports = {
  parseBooleanEnv,
  assertSchemaReadyForAlignment,
};

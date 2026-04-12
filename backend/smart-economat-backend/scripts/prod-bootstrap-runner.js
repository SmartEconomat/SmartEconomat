#!/usr/bin/env node

const { existsSync } = require('node:fs');
const { resolve } = require('node:path');

const MAX_INIT_ATTEMPTS = 30;
const RETRY_DELAY_MS = 2000;

function sleep(ms) {
  return new Promise((resolvePromise) => {
    setTimeout(resolvePromise, ms);
  });
}

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

function getDistDataSource(cwd) {
  const configPath = resolve(cwd, 'dist/config/typeorm.config.js');

  if (!existsSync(configPath)) {
    throw new Error(
      `[prod-bootstrap-runner] No se encontro config dist en ${configPath}`
    );
  }

  const loaded = require(configPath);
  const dataSource = loaded.default || loaded.AppDataSource;

  if (!dataSource || typeof dataSource.initialize !== 'function') {
    throw new Error(
      '[prod-bootstrap-runner] DataSource invalido en dist/config/typeorm.config.js'
    );
  }

  return dataSource;
}

async function initializeWithRetry(dataSource) {
  let lastError;

  for (let attempt = 1; attempt <= MAX_INIT_ATTEMPTS; attempt++) {
    try {
      await dataSource.initialize();
      return;
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      console.warn(
        `[prod-bootstrap-runner] Intento ${attempt}/${MAX_INIT_ATTEMPTS} sin conexion a DB: ${message}`
      );
      await sleep(RETRY_DELAY_MS);
    }
  }

  throw lastError;
}

async function runMigrationsIfEnabled(dataSource) {
  const migrationsEnabled = parseBooleanEnv(
    process.env.STARTUP_RUN_MIGRATIONS,
    true
  );

  if (!migrationsEnabled) {
    console.warn(
      '[prod-bootstrap-runner] STARTUP_RUN_MIGRATIONS=false, se omite migration run al arranque.'
    );
    return;
  }

  const executedMigrations = await dataSource.runMigrations({
    transaction: 'all',
  });

  if (executedMigrations.length === 0) {
    console.log('[prod-bootstrap-runner] No hay migraciones pendientes.');
    return;
  }

  const migrationNames = executedMigrations
    .map((migration) => migration.name)
    .join(', ');
  console.log(
    `[prod-bootstrap-runner] Migraciones aplicadas correctamente: ${migrationNames}`
  );
}

async function applySchemaAlignment(dataSource) {
  console.log('[prod-bootstrap-runner] Verificando alineacion de esquema...');

  const statements = [
    `ALTER TABLE IF EXISTS "produccion_lote" ADD COLUMN IF NOT EXISTS "fecha_agotado" TIMESTAMP WITH TIME ZONE`,

    `ALTER TABLE IF EXISTS "pedido_usuario" ADD COLUMN IF NOT EXISTS "ubicacion_entrega_sugerida_id" uuid`,

    `ALTER TABLE IF EXISTS "purchase_batch" ADD COLUMN IF NOT EXISTS "numero_global" bigint`,
    `ALTER TABLE IF EXISTS "purchase_batch" ADD COLUMN IF NOT EXISTS "referencia" varchar(32)`,
    `ALTER TABLE IF EXISTS "purchase_batch" ADD COLUMN IF NOT EXISTS "is_aprobado" boolean DEFAULT false`,

    `WITH current_max AS (
       SELECT COALESCE(MAX(numero_global), 99999) AS max_num FROM purchase_batch
     ), missing AS (
       SELECT id, ROW_NUMBER() OVER (ORDER BY created_at, id) AS rn
       FROM purchase_batch
       WHERE numero_global IS NULL
     )
     UPDATE purchase_batch pb
     SET numero_global = (SELECT max_num FROM current_max) + missing.rn
     FROM missing
     WHERE pb.id = missing.id`,
    `UPDATE purchase_batch SET referencia = CONCAT('LC-', LPAD(numero_global::text, 6, '0')) WHERE referencia IS NULL AND numero_global IS NOT NULL`,
    `UPDATE purchase_batch SET is_aprobado = false WHERE is_aprobado IS NULL`,

    `DO $$
     BEGIN
       IF NOT EXISTS (
         SELECT 1 FROM pg_type t
         JOIN pg_namespace n ON n.oid = t.typnamespace
         WHERE n.nspname = 'public' AND t.typname = 'estado_distribucion_enum'
       ) THEN
         CREATE TYPE "public"."estado_distribucion_enum" AS ENUM ('borrador', 'preparada', 'parcial', 'entregada', 'cancelada');
       END IF;
     END $$;`,
    `DO $$
     BEGIN
       IF NOT EXISTS (
         SELECT 1 FROM pg_type t
         JOIN pg_namespace n ON n.oid = t.typnamespace
         WHERE n.nspname = 'public' AND t.typname = 'estado_distribucion_linea_enum'
       ) THEN
         CREATE TYPE "public"."estado_distribucion_linea_enum" AS ENUM ('pendiente', 'parcial', 'entregada', 'cancelada');
       END IF;
     END $$;`,

    `CREATE TABLE IF NOT EXISTS "distribucion" (
       "id" uuid NOT NULL DEFAULT uuid_generate_v7(),
       "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
       "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
       "deleted_at" TIMESTAMP WITH TIME ZONE,
       "deleted_by" uuid,
       "modified_by" uuid,
       "version" integer NOT NULL DEFAULT '1',
       "usuario_responsable_id" uuid,
       "pedido_usuario_id" uuid NOT NULL,
       "ubicacion_origen_id" uuid NOT NULL,
       "ubicacion_destino_id" uuid NOT NULL,
       "alumno_slot_id" uuid,
       "estado" "public"."estado_distribucion_enum" NOT NULL DEFAULT 'preparada',
       "fecha_preparacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
       "fecha_entrega" TIMESTAMP WITH TIME ZONE,
       "observaciones" text,
       "motivo_cancelacion" text,
       CONSTRAINT "PK_efd4f28fc8f8f0fb14a8f4502f7" PRIMARY KEY ("id")
     )`,
    `CREATE TABLE IF NOT EXISTS "distribucion_linea" (
       "id" uuid NOT NULL DEFAULT uuid_generate_v7(),
       "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
       "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
       "deleted_at" TIMESTAMP WITH TIME ZONE,
       "deleted_by" uuid,
       "modified_by" uuid,
       "version" integer NOT NULL DEFAULT '1',
       "distribucion_id" uuid NOT NULL,
       "pedido_usuario_linea_id" uuid NOT NULL,
       "producto_proveedor_id" uuid NOT NULL,
       "cantidad_pedida" numeric(12,3) NOT NULL,
       "cantidad_recepcionada_atribuida" numeric(12,3) NOT NULL,
       "cantidad_ya_distribuida" numeric(12,3) NOT NULL DEFAULT '0',
       "cantidad_a_distribuir" numeric(12,3) NOT NULL,
       "cantidad_entregada" numeric(12,3) NOT NULL DEFAULT '0',
       "estado" "public"."estado_distribucion_linea_enum" NOT NULL DEFAULT 'pendiente',
       "observaciones" text,
       CONSTRAINT "PK_7f3a826568f4dccf73d4e6dc3b2" PRIMARY KEY ("id")
     )`,

    `DO $$
     BEGIN
       IF NOT EXISTS (
         SELECT 1
         FROM pg_enum e
         JOIN pg_type t ON e.enumtypid = t.oid
         JOIN pg_namespace n ON n.oid = t.typnamespace
         WHERE n.nspname = 'public'
           AND t.typname = 'movimiento_tipo_enum'
           AND e.enumlabel = 'salida_distribucion'
       ) THEN
         ALTER TYPE "public"."movimiento_tipo_enum" ADD VALUE 'salida_distribucion' BEFORE 'salida_elaboracion';
       END IF;
     END $$;`,
    `DO $$
     BEGIN
       IF NOT EXISTS (
         SELECT 1
         FROM pg_enum e
         JOIN pg_type t ON e.enumtypid = t.oid
         JOIN pg_namespace n ON n.oid = t.typnamespace
         WHERE n.nspname = 'public'
           AND t.typname = 'movimiento_tipo_enum'
           AND e.enumlabel = 'entrada_distribucion'
       ) THEN
         ALTER TYPE "public"."movimiento_tipo_enum" ADD VALUE 'entrada_distribucion' BEFORE 'salida_elaboracion';
       END IF;
     END $$;`,
    `DO $$
     BEGIN
       IF EXISTS (
         SELECT 1 FROM pg_type t
         JOIN pg_namespace n ON n.oid = t.typnamespace
         WHERE n.nspname = 'public' AND t.typname = 'estado_distribucion_enum'
       ) AND NOT EXISTS (
         SELECT 1
         FROM pg_enum e
         JOIN pg_type t ON e.enumtypid = t.oid
         JOIN pg_namespace n ON n.oid = t.typnamespace
         WHERE n.nspname = 'public'
           AND t.typname = 'estado_distribucion_enum'
           AND e.enumlabel = 'borrador'
       ) THEN
         ALTER TYPE "public"."estado_distribucion_enum" ADD VALUE 'borrador' BEFORE 'preparada';
       END IF;
     END $$;`,

    `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_7bedb0fdabc594fb142723d87b2" ON "purchase_batch" ("numero_global")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_68b42dc060894145a2ccc528298" ON "purchase_batch" ("referencia")`,
    `CREATE INDEX IF NOT EXISTS "IDX_distribucion_pedido_usuario_id" ON "distribucion" ("pedido_usuario_id")`,
    `CREATE INDEX IF NOT EXISTS "IDX_distribucion_usuario_responsable_id" ON "distribucion" ("usuario_responsable_id")`,
    `CREATE INDEX IF NOT EXISTS "IDX_distribucion_estado" ON "distribucion" ("estado")`,
    `CREATE INDEX IF NOT EXISTS "IDX_distribucion_ubicacion_origen_id" ON "distribucion" ("ubicacion_origen_id")`,
    `CREATE INDEX IF NOT EXISTS "IDX_distribucion_ubicacion_destino_id" ON "distribucion" ("ubicacion_destino_id")`,
    `CREATE INDEX IF NOT EXISTS "IDX_distribucion_linea_distribucion_id" ON "distribucion_linea" ("distribucion_id")`,
    `CREATE INDEX IF NOT EXISTS "IDX_distribucion_linea_pedido_usuario_linea_id" ON "distribucion_linea" ("pedido_usuario_linea_id")`,
    `CREATE INDEX IF NOT EXISTS "IDX_distribucion_linea_producto_proveedor_id" ON "distribucion_linea" ("producto_proveedor_id")`,

    `DO $$
     BEGIN
       IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_pedido_usuario_ubicacion_entrega_sugerida_id') THEN
         ALTER TABLE "pedido_usuario"
           ADD CONSTRAINT "FK_pedido_usuario_ubicacion_entrega_sugerida_id"
           FOREIGN KEY ("ubicacion_entrega_sugerida_id") REFERENCES "ubicacion"("id")
           ON DELETE SET NULL ON UPDATE NO ACTION;
       END IF;
     END $$;`,

    `DO $$
     BEGIN
       IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_distribucion_usuario_responsable_id') THEN
         ALTER TABLE "distribucion" ADD CONSTRAINT "FK_distribucion_usuario_responsable_id"
           FOREIGN KEY ("usuario_responsable_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
       END IF;
       IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_distribucion_pedido_usuario_id') THEN
         ALTER TABLE "distribucion" ADD CONSTRAINT "FK_distribucion_pedido_usuario_id"
           FOREIGN KEY ("pedido_usuario_id") REFERENCES "pedido_usuario"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
       END IF;
       IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_distribucion_ubicacion_origen_id') THEN
         ALTER TABLE "distribucion" ADD CONSTRAINT "FK_distribucion_ubicacion_origen_id"
           FOREIGN KEY ("ubicacion_origen_id") REFERENCES "ubicacion"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
       END IF;
       IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_distribucion_ubicacion_destino_id') THEN
         ALTER TABLE "distribucion" ADD CONSTRAINT "FK_distribucion_ubicacion_destino_id"
           FOREIGN KEY ("ubicacion_destino_id") REFERENCES "ubicacion"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
       END IF;
       IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_distribucion_alumno_slot_id') THEN
         ALTER TABLE "distribucion" ADD CONSTRAINT "FK_distribucion_alumno_slot_id"
           FOREIGN KEY ("alumno_slot_id") REFERENCES "alumno_slot"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
       END IF;
     END $$;`,

    `DO $$
     BEGIN
       IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_distribucion_linea_distribucion_id') THEN
         ALTER TABLE "distribucion_linea" ADD CONSTRAINT "FK_distribucion_linea_distribucion_id"
           FOREIGN KEY ("distribucion_id") REFERENCES "distribucion"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
       END IF;
       IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_distribucion_linea_pedido_usuario_linea_id') THEN
         ALTER TABLE "distribucion_linea" ADD CONSTRAINT "FK_distribucion_linea_pedido_usuario_linea_id"
           FOREIGN KEY ("pedido_usuario_linea_id") REFERENCES "pedido_usuario_linea"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
       END IF;
       IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_distribucion_linea_producto_proveedor_id') THEN
         ALTER TABLE "distribucion_linea" ADD CONSTRAINT "FK_distribucion_linea_producto_proveedor_id"
           FOREIGN KEY ("producto_proveedor_id") REFERENCES "producto_proveedor"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
       END IF;
     END $$;`,
  ];

  for (const sql of statements) {
    await dataSource.query(sql);
  }

  console.log('[prod-bootstrap-runner] Alineacion de esquema completada.');
}

async function runBootstrap() {
  const cwd = process.cwd();
  const dataSource = getDistDataSource(cwd);

  await initializeWithRetry(dataSource);

  try {
    await runMigrationsIfEnabled(dataSource);
    await applySchemaAlignment(dataSource);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

async function main() {
  try {
    await runBootstrap();

    const args = process.argv.slice(2);

    if (args.length === 0) {
      console.error(
        '[prod-bootstrap-runner] No se especificó comando a ejecutar después de bootstrap.'
      );
      process.exit(1);
    }

    const separatorIndex = args.indexOf('--');
    if (separatorIndex === -1) {
      console.error(
        '[prod-bootstrap-runner] No se encontró separador "--" en argumentos.'
      );
      process.exit(1);
    }

    const command = args[separatorIndex + 1];
    const commandArgs = args.slice(separatorIndex + 2);

    if (!command) {
      console.error(
        '[prod-bootstrap-runner] No se especificó comando después de "--".'
      );
      process.exit(1);
    }

    console.log(
      `[prod-bootstrap-runner] Bootstrap completado. Pasando control a: ${command} ${commandArgs.join(' ')}`
    );

    const { execFile } = require('child_process');
    execFile(
      command,
      commandArgs,
      { stdio: 'inherit' },
      (error, stdout, stderr) => {
        if (error) {
          console.error(
            '[prod-bootstrap-runner] Error ejecutando aplicación:',
            error
          );
          process.exit(1);
        }
      }
    );
  } catch (error) {
    console.error('[prod-bootstrap-runner] Error inesperado:', error);
    process.exit(1);
  }
}

main();

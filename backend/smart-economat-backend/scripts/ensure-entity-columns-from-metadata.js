/**
 * Alineación no destructiva del esquema PostgreSQL con las entidades TypeORM registradas
 * en el DataSource: añade columnas faltantes (ADD COLUMN IF NOT EXISTS) según metadatos.
 *
 * No elimina columnas ni modifica tipos existentes. Pensado para bases legacy desalineadas.
 */

/**
 * @typedef {import('typeorm').DataSource} DataSource
 */

/**
 * Quoted identifier for PostgreSQL.
 * @param {string} id
 */
function qIdent(id) {
  if (!id) {
    return '""';
  }
  return `"${String(id).replace(/"/g, '""')}"`;
}

/**
 * @param {import('typeorm/metadata/ColumnMetadata').ColumnMetadata} column
 * @returns {string}
 */
function resolveEnumTypeName(column) {
  if (column.enumName) {
    return column.enumName;
  }
  const table = column.entityMetadata.tableName;
  const col = column.databaseName.toLowerCase();
  return `${table}_${col}_enum`;
}

/**
 * @param {import('typeorm/metadata/ColumnMetadata').ColumnMetadata} column
 * @param {string} schema
 * @returns {string}
 */
function enumTypeSqlRef(column, schema) {
  const typ = resolveEnumTypeName(column);
  return `${qIdent(schema)}.${qIdent(typ)}`;
}

/**
 * Enum labels escapados para CREATE TYPE AS ENUM (...).
 * @param {import('typeorm/metadata/ColumnMetadata').ColumnMetadata} column
 */
function enumLabelsForPg(column) {
  if (!column.enum || column.enum.length === 0) {
    return [];
  }
  return column.enum.map((v) => {
    const s = String(v).replace(/'/g, "''");
    return `'${s}'`;
  });
}

/**
 * @param {import('typeorm/driver/postgres/PostgresDriver').PostgresDriver} driver
 * @param {import('typeorm/metadata/ColumnMetadata').ColumnMetadata} column
 * @param {string} schema
 */
function resolveFullColumnType(driver, column, schema) {
  const raw = column.type;

  // En Postgres "simple-enum" persiste como texto (no como CREATE TYPE ... ENUM).
  if (raw === 'simple-enum') {
    return column.isArray ? 'text[]' : 'text';
  }

  if (raw === 'enum') {
    const base = enumTypeSqlRef(column, schema);
    if (column.isArray) {
      return `${base}[]`;
    }
    return base;
  }

  if (raw === 'simple-array') {
    const base = 'text';
    return column.isArray ? `${base}[]` : base;
  }

  if (raw === 'simple-json') {
    const base = 'text';
    return column.isArray ? `${base}[]` : base;
  }

  return driver.createFullType(column);
}

/**
 * @param {import('typeorm/driver/postgres/PostgresDriver').PostgresDriver} driver
 * @param {import('typeorm/metadata/ColumnMetadata').ColumnMetadata} column
 * @returns {string | undefined}
 */
function buildDefaultSql(driver, column) {
  if (column.default === undefined || column.default === null) {
    return undefined;
  }
  const normalized = driver.normalizeDefault(column);
  if (normalized === undefined) {
    return undefined;
  }
  return normalized;
}

/**
 * @param {import('typeorm/metadata/ColumnMetadata').ColumnMetadata} column
 */
function hasImplicitDefault(column) {
  if (column.default !== undefined && column.default !== null) {
    return true;
  }
  if (column.isGenerated) {
    return true;
  }
  if (column.isCreateDate || column.isUpdateDate || column.isDeleteDate) {
    return true;
  }
  if (column.isVersion) {
    return true;
  }
  return false;
}

/**
 * @param {DataSource} dataSource
 * @param {string} schema
 */
async function loadExistingTableColumnSet(dataSource, schema) {
  const rows = await dataSource.query(
    `SELECT "table_name" AS table_name, "column_name" AS column_name
     FROM information_schema.columns
     WHERE table_schema = $1`,
    [schema]
  );
  /** @type {Set<string>} */
  const set = new Set();
  for (const r of rows) {
    set.add(`${r.table_name}.${r.column_name}`);
  }
  return set;
}

/**
 * @param {DataSource} dataSource
 * @param {string} schema
 */
async function loadExistingTableSet(dataSource, schema) {
  const rows = await dataSource.query(
    `SELECT "table_name" AS table_name
     FROM information_schema.tables
     WHERE table_schema = $1
       AND table_type = 'BASE TABLE'`,
    [schema]
  );
  /** @type {Set<string>} */
  const set = new Set();
  for (const r of rows) {
    set.add(r.table_name);
  }
  return set;
}

/**
 * @param {DataSource} dataSource
 * @param {string} schema
 * @param {string} typeName
 */
async function pgEnumTypeExists(dataSource, schema, typeName) {
  const r = await dataSource.query(
    `SELECT EXISTS (
       SELECT 1
       FROM pg_type t
       JOIN pg_namespace n ON n.oid = t.typnamespace
       WHERE n.nspname = $1
         AND t.typname = $2
     ) AS "exists"`,
    [schema, typeName]
  );
  return Boolean(r[0]?.exists);
}

/**
 * @param {DataSource} dataSource
 * @param {import('typeorm/metadata/ColumnMetadata').ColumnMetadata} column
 * @param {string} schema
 */
async function ensurePgEnumType(dataSource, column, schema) {
  if (column.type !== 'enum') {
    return { ok: true };
  }

  const typeName = resolveEnumTypeName(column);
  const exists = await pgEnumTypeExists(dataSource, schema, typeName);
  if (exists) {
    return { ok: true };
  }

  const labels = enumLabelsForPg(column);
  if (labels.length === 0) {
    console.warn(
      `[ensure-entity-columns] No se puede crear el enum "${schema}"."${typeName}" para ` +
        `${column.entityMetadata.name}.${column.propertyName}: sin valores en metadata. Omitiendo columna.`
    );
    return { ok: false };
  }

  const values = labels.join(', ');
  await dataSource.query(
    `CREATE TYPE ${qIdent(schema)}.${qIdent(typeName)} AS ENUM (${values})`
  );
  console.log(
    `[ensure-entity-columns] Creado tipo enum ${qIdent(schema)}.${qIdent(typeName)}.`
  );
  return { ok: true };
}

/**
 * @param {DataSource} dataSource
 */
async function ensureEntityColumnsFromMetadata(dataSource) {
  const driver = dataSource.driver;
  if (!driver || driver.options.type !== 'postgres') {
    console.warn(
      '[ensure-entity-columns] Driver no es postgres; no se aplica alineacion de columnas.'
    );
    return;
  }

  console.log(
    '[ensure-entity-columns] Comprobando columnas frente a metadatos de entidades...'
  );

  /** @type {Map<string, import('typeorm/metadata/ColumnMetadata').ColumnMetadata>} */
  const columnByTableCol = new Map();
  const keySep = '\u001f';

  for (const meta of dataSource.entityMetadatas) {
    if (meta.tableType === 'view') {
      continue;
    }
    const schema = meta.schema || 'public';
    const tableName = meta.tableName;
    for (const col of meta.columns) {
      if (col.isVirtualProperty) {
        continue;
      }
      const key = `${schema}${keySep}${tableName}${keySep}${col.databaseName}`;
      if (!columnByTableCol.has(key)) {
        columnByTableCol.set(key, col);
      }
    }
  }

  const schemas = new Set();
  for (const key of columnByTableCol.keys()) {
    const s = key.split(keySep)[0];
    if (s) {
      schemas.add(s);
    }
  }

  let added = 0;
  let skipped = 0;

  for (const schema of schemas) {
    const existingColumns = await loadExistingTableColumnSet(
      dataSource,
      schema
    );
    const existingTables = await loadExistingTableSet(dataSource, schema);

    for (const [key, column] of columnByTableCol) {
      const parts = key.split(keySep);
      if (parts.length < 3) {
        continue;
      }
      if (parts[0] !== schema) {
        continue;
      }
      const tbl = parts[1];
      const colName = parts[2];
      if (!existingTables.has(tbl)) {
        skipped++;
        continue;
      }
      const shortKey = `${tbl}.${colName}`;
      if (existingColumns.has(shortKey)) {
        continue;
      }

      const enumOk = await ensurePgEnumType(dataSource, column, schema);
      if (!enumOk.ok) {
        skipped++;
        continue;
      }

      const fullType = resolveFullColumnType(driver, column, schema);
      const defaultSql = buildDefaultSql(driver, column);

      let nullSql = 'NULL';
      if (!column.isNullable) {
        if (defaultSql !== undefined || hasImplicitDefault(column)) {
          nullSql = 'NOT NULL';
        } else {
          nullSql = 'NULL';
          console.warn(
            `[ensure-entity-columns] Columna "${colName}" en "${schema}"."${tbl}" es NOT NULL sin default en metadata; ` +
              `se añade como NULL para no fallar en tablas con datos.`
          );
        }
      }

      let stmt =
        `ALTER TABLE ${qIdent(schema)}.${qIdent(tbl)} ADD COLUMN IF NOT EXISTS ` +
        `${qIdent(colName)} ${fullType}`;

      if (defaultSql !== undefined) {
        stmt += ` DEFAULT (${defaultSql})`;
      }
      stmt += ` ${nullSql}`;

      await dataSource.query(stmt);
      existingColumns.add(shortKey);
      added++;
      console.log(
        `[ensure-entity-columns] Añadida columna ${qIdent(schema)}.${qIdent(tbl)}.${qIdent(colName)} (${fullType}).`
      );
    }
  }

  console.log(
    `[ensure-entity-columns] Fin: columnas añadidas (${added}), filas omitidas por tabla ausente u otros (${skipped}).`
  );
}

module.exports = {
  ensureEntityColumnsFromMetadata,
};

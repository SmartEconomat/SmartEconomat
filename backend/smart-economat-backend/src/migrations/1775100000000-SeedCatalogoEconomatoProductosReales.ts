import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { MigrationInterface, QueryRunner } from 'typeorm';

type SeedSource = 'catalogo' | 'inventario';

type SeedRecord = Record<string, unknown>;

type SeedCatalogFile = {
  productos?: unknown;
};

type NormalizedSeedProduct = {
  nombre: string;
  marca: string | null;
  descripcion: string;
  unidad: string;
  tipo: string;
  codigoBarras: string | null;
  contenido: number;
  pmp: number;
  precioUnitario: number | null;
  mermaEsperada: number;
  pathImg: string | null;
  fechaCaducidad: string | null;
  alergenos: string[];
  source: SeedSource;
};

const VALID_UNIDADES = new Set(['KG', 'G', 'L', 'ML', 'UNIDAD', 'PAQ']);
const VALID_TIPOS = new Set([
  'verdura',
  'fruta',
  'carne',
  'pescado',
  'marisco',
  'lacteo',
  'huevo',
  'cereal',
  'legumbre',
  'fruto_seco',
  'condimento',
  'aceite',
  'azucar',
  'bebida',
  'elaborado',
  'otro',
]);
const VALID_ALERGENOS = new Set([
  'GLUTEN',
  'CRUSTACEOS',
  'HUEVOS',
  'PESCADO',
  'CACAHUETES',
  'SOJA',
  'LACTEOS',
  'FRUTOS_CON_CASCARA',
  'APIO',
  'MOSTAZA',
  'SESAMO',
  'SULFITO',
  'ALTRAMUCES',
  'MOLUSCOS',
]);

const MIGRATION_TAG = '[MIGRACION_CATALOGO_ECONOMATO_20260402]';
const MIGRATION_PROVIDER_NAME =
  'Proveedor catalogo economato migracion 20260402';
const MIGRATION_LOCATION_NAME =
  'Ubicacion inventario economato migracion 20260402';
const CATALOGO_JSON_PATH = resolve(
  process.cwd(),
  'src/seeders/datos-base-economato/catalogo.productos-normalizados.json'
);
const INVENTARIO_JSON_PATH = resolve(
  process.cwd(),
  'src/seeders/datos-base-economato/inventario-articulos.productos-normalizados.json'
);

export class SeedCatalogoEconomatoProductosReales1775100000000 implements MigrationInterface {
  public name = 'SeedCatalogoEconomatoProductosReales1775100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const productos = [
      ...this.loadSeedProducts(CATALOGO_JSON_PATH, 'catalogo'),
      ...this.loadSeedProducts(INVENTARIO_JSON_PATH, 'inventario'),
    ];

    if (productos.length === 0) {
      return;
    }

    const proveedorId = await this.ensureMigrationProveedor(queryRunner);
    const ubicacionId = await this.ensureMigrationUbicacion(queryRunner);

    const existingCodeRows = (await queryRunner.query(
      'SELECT "codigo_barras" FROM "producto" WHERE "codigo_barras" IS NOT NULL'
    )) as Array<{ codigo_barras?: string | null }>;

    const usedBarcodes = new Set(
      existingCodeRows
        .map((row) => this.normalizeString(row.codigo_barras, 130))
        .filter((value): value is string => value !== null)
    );

    for (const producto of productos) {
      const codigoBarras = this.reserveBarcode(
        producto.codigoBarras,
        usedBarcodes
      );

      const insertedProducto = (await queryRunner.query(
        `INSERT INTO "producto" (
          "nombre",
          "marca",
          "descripcion",
          "unidad",
          "fecha_caducidad",
          "path_img",
          "tipo",
          "codigo_barras",
          "contenido",
          "pmp"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING "id"`,
        [
          producto.nombre,
          producto.marca,
          producto.descripcion,
          producto.unidad,
          producto.fechaCaducidad,
          producto.pathImg,
          producto.tipo,
          codigoBarras,
          producto.contenido,
          producto.pmp,
        ]
      )) as Array<{ id?: string }>;

      const productoId = insertedProducto[0]?.id;
      if (!productoId) {
        throw new Error(
          'La migracion no pudo recuperar el id del producto insertado.'
        );
      }

      for (const alergeno of producto.alergenos) {
        await queryRunner.query(
          `INSERT INTO "producto_alergeno" ("producto_id", "alergeno")
           VALUES ($1, $2)
           ON CONFLICT ("producto_id", "alergeno") DO NOTHING`,
          [productoId, alergeno]
        );
      }

      const insertedProductoProveedor = (await queryRunner.query(
        `INSERT INTO "producto_proveedor" (
          "producto_id",
          "proveedor_id",
          "marca",
          "codigo_barras",
          "precio_unitario",
          "merma_esperada",
          "pmp"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING "id"`,
        [
          productoId,
          proveedorId,
          producto.marca,
          codigoBarras,
          producto.precioUnitario,
          producto.mermaEsperada,
          producto.pmp,
        ]
      )) as Array<{ id?: string }>;

      const productoProveedorId = insertedProductoProveedor[0]?.id;
      if (!productoProveedorId) {
        throw new Error(
          'La migracion no pudo recuperar el id de producto_proveedor insertado.'
        );
      }

      if (producto.source === 'inventario') {
        await queryRunner.query(
          `INSERT INTO "inventario" (
            "producto_proveedor_id",
            "ubicacion_id",
            "cantidad_actual",
            "cantidad_minima",
            "cantidad_maxima",
            "fecha_caducidad"
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            productoProveedorId,
            ubicacionId,
            0,
            0,
            null,
            producto.fechaCaducidad,
          ]
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const taggedProducts = (await queryRunner.query(
      `SELECT "id"
       FROM "producto"
       WHERE "descripcion" LIKE $1`,
      [`%${MIGRATION_TAG}%`]
    )) as Array<{ id?: string }>;

    const productoIds = taggedProducts
      .map((row) => this.normalizeString(row.id, 36))
      .filter((value): value is string => value !== null);

    if (productoIds.length > 0) {
      await queryRunner.query(
        `DELETE FROM "inventario"
         WHERE "producto_proveedor_id" IN (
           SELECT "id"
           FROM "producto_proveedor"
           WHERE "producto_id" = ANY($1::uuid[])
         )`,
        [productoIds]
      );

      await queryRunner.query(
        `DELETE FROM "producto_proveedor"
         WHERE "producto_id" = ANY($1::uuid[])`,
        [productoIds]
      );

      await queryRunner.query(
        `DELETE FROM "producto_alergeno"
         WHERE "producto_id" = ANY($1::uuid[])`,
        [productoIds]
      );

      await queryRunner.query(
        `DELETE FROM "producto"
         WHERE "id" = ANY($1::uuid[])
           AND "descripcion" LIKE $2`,
        [productoIds, `%${MIGRATION_TAG}%`]
      );
    }

    const ubicacionRows = (await queryRunner.query(
      `SELECT "id"
       FROM "ubicacion"
       WHERE "nombre" = $1`,
      [MIGRATION_LOCATION_NAME]
    )) as Array<{ id?: string }>;

    for (const row of ubicacionRows) {
      const ubicacionId = this.normalizeString(row.id, 36);
      if (!ubicacionId) {
        continue;
      }

      const hasInventarioRefs = (await queryRunner.query(
        `SELECT 1
         FROM "inventario"
         WHERE "ubicacion_id" = $1
         LIMIT 1`,
        [ubicacionId]
      )) as Array<{ '?column?'?: number }>;

      if (hasInventarioRefs.length === 0) {
        await queryRunner.query('DELETE FROM "ubicacion" WHERE "id" = $1', [
          ubicacionId,
        ]);
      }
    }

    const proveedorRows = (await queryRunner.query(
      `SELECT "id"
       FROM "proveedor"
       WHERE "nombre" = $1`,
      [MIGRATION_PROVIDER_NAME]
    )) as Array<{ id?: string }>;

    for (const row of proveedorRows) {
      const proveedorId = this.normalizeString(row.id, 36);
      if (!proveedorId) {
        continue;
      }

      const hasProductoProveedorRefs = (await queryRunner.query(
        `SELECT 1
         FROM "producto_proveedor"
         WHERE "proveedor_id" = $1
         LIMIT 1`,
        [proveedorId]
      )) as Array<{ '?column?'?: number }>;

      if (hasProductoProveedorRefs.length === 0) {
        await queryRunner.query('DELETE FROM "proveedor" WHERE "id" = $1', [
          proveedorId,
        ]);
      }
    }
  }

  private loadSeedProducts(
    filePath: string,
    source: SeedSource
  ): NormalizedSeedProduct[] {
    const parsed = this.readCatalogFile(filePath);
    const rows = Array.isArray(parsed.productos) ? parsed.productos : [];

    const normalized: NormalizedSeedProduct[] = [];
    for (let index = 0; index < rows.length; index++) {
      const product = this.normalizeSeedProduct(rows[index], source, index + 1);
      if (product) {
        normalized.push(product);
      }
    }

    return normalized;
  }

  private readCatalogFile(filePath: string): SeedCatalogFile {
    const raw = readFileSync(filePath, 'utf8');
    return JSON.parse(raw) as SeedCatalogFile;
  }

  private normalizeSeedProduct(
    input: unknown,
    source: SeedSource,
    rowNumber: number
  ): NormalizedSeedProduct | null {
    if (!this.isRecord(input)) {
      return null;
    }

    const nombre = this.normalizeString(input.nombre, 100);
    if (!nombre) {
      return null;
    }

    const marca = this.normalizeString(input.marca, 100);
    const descripcionBase =
      this.normalizeDescription(input.descripcion) ||
      `Producto migrado desde dataset ${source}.`;
    const descripcion = `${descripcionBase}\n${MIGRATION_TAG} source=${source} row=${rowNumber}`;

    const unidad = this.normalizeUnidad(input.unidad);
    const tipo = this.normalizeTipo(input.tipo);
    const codigoBarras = this.normalizeString(input.codigoBarras, 130);
    const contenido = this.normalizePositiveNumber(input.contenido, 1, 10, 2);

    const metadata = this.isRecord(input.metadataCsv)
      ? input.metadataCsv
      : null;
    const precioUnitario = this.normalizePositiveNumberOrNull(
      metadata?.precioUnitario,
      10,
      2
    );
    const pmp = this.normalizePositiveNumber(
      metadata?.precioUnitario,
      0,
      10,
      4
    );

    const rendimiento = this.normalizeFiniteNumber(metadata?.rendimiento);
    const mermaEsperada =
      rendimiento === null
        ? 0
        : this.round(this.clamp(100 - rendimiento, 0, 100), 2);

    const alergenos = this.normalizeAlergenos(input.alergenos);

    return {
      nombre,
      marca,
      descripcion,
      unidad,
      tipo,
      codigoBarras,
      contenido,
      pmp,
      precioUnitario,
      mermaEsperada,
      pathImg: this.normalizeString(input.pathImg, 200),
      fechaCaducidad: this.normalizeIsoDate(input.fechaCaducidad),
      alergenos,
      source,
    };
  }

  private normalizeUnidad(value: unknown): string {
    const normalized = this.normalizeString(value, 16)?.toUpperCase() ?? '';
    if (VALID_UNIDADES.has(normalized)) {
      return normalized;
    }
    return 'UNIDAD';
  }

  private normalizeTipo(value: unknown): string {
    const normalized = this.normalizeString(value, 32)?.toLowerCase() ?? '';
    if (VALID_TIPOS.has(normalized)) {
      return normalized;
    }
    return 'otro';
  }

  private normalizeAlergenos(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    const unique = new Set<string>();
    for (const item of value) {
      const normalized = this.normalizeString(item, 64)?.toUpperCase() ?? '';
      if (normalized && VALID_ALERGENOS.has(normalized)) {
        unique.add(normalized);
      }
    }

    return [...unique];
  }

  private normalizeDescription(value: unknown): string | null {
    const normalized = this.normalizeString(value);
    if (!normalized) {
      return null;
    }
    return normalized;
  }

  private normalizeString(value: unknown, maxLength?: number): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    if (typeof maxLength === 'number' && maxLength > 0) {
      return trimmed.slice(0, maxLength);
    }

    return trimmed;
  }

  private normalizePositiveNumber(
    value: unknown,
    fallback: number,
    precision: number,
    scale: number
  ): number {
    const parsed = this.normalizeFiniteNumber(value);
    if (parsed === null || parsed <= 0) {
      return fallback;
    }

    return this.enforceNumericBounds(parsed, precision, scale);
  }

  private normalizePositiveNumberOrNull(
    value: unknown,
    precision: number,
    scale: number
  ): number | null {
    const parsed = this.normalizeFiniteNumber(value);
    if (parsed === null || parsed <= 0) {
      return null;
    }

    return this.enforceNumericBounds(parsed, precision, scale);
  }

  private normalizeFiniteNumber(value: unknown): number | null {
    const numeric = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(numeric)) {
      return null;
    }

    return numeric;
  }

  private enforceNumericBounds(
    value: number,
    precision: number,
    scale: number
  ): number {
    const rounded = this.round(value, scale);
    const integerDigits = Math.max(0, precision - scale);
    const maxInteger = Math.pow(10, integerDigits) - Math.pow(10, -scale);
    const minValue = -maxInteger;
    const maxValue = maxInteger;

    if (rounded < minValue) {
      return minValue;
    }
    if (rounded > maxValue) {
      return maxValue;
    }

    return rounded;
  }

  private round(value: number, scale: number): number {
    const factor = Math.pow(10, scale);
    return Math.round(value * factor) / factor;
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }

  private normalizeIsoDate(value: unknown): string | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    if (typeof value !== 'string' && typeof value !== 'number') {
      return null;
    }

    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date.toISOString();
  }

  private async ensureMigrationProveedor(
    queryRunner: QueryRunner
  ): Promise<string> {
    const existing = (await queryRunner.query(
      `SELECT "id", "deleted_at"
       FROM "proveedor"
       WHERE "nombre" = $1
       ORDER BY "created_at" ASC
       LIMIT 1`,
      [MIGRATION_PROVIDER_NAME]
    )) as Array<{ id?: string; deleted_at?: Date | null }>;

    const existingId = this.normalizeString(existing[0]?.id, 36);
    if (existingId) {
      if (existing[0]?.deleted_at) {
        await queryRunner.query(
          `UPDATE "proveedor"
           SET "deleted_at" = NULL,
               "deleted_by" = NULL
           WHERE "id" = $1`,
          [existingId]
        );
      }
      return existingId;
    }

    const inserted = (await queryRunner.query(
      `INSERT INTO "proveedor" (
        "nombre",
        "contacto",
        "telefono",
        "email",
        "direccion"
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING "id"`,
      [
        MIGRATION_PROVIDER_NAME,
        'Migracion datos base economato',
        null,
        null,
        'Proveedor tecnico creado por migracion de catalogo economato.',
      ]
    )) as Array<{ id?: string }>;

    const proveedorId = this.normalizeString(inserted[0]?.id, 36);
    if (!proveedorId) {
      throw new Error('No se pudo crear el proveedor de migracion.');
    }

    return proveedorId;
  }

  private async ensureMigrationUbicacion(
    queryRunner: QueryRunner
  ): Promise<string> {
    const existing = (await queryRunner.query(
      `SELECT "id", "deleted_at"
       FROM "ubicacion"
       WHERE "nombre" = $1
       ORDER BY "created_at" ASC
       LIMIT 1`,
      [MIGRATION_LOCATION_NAME]
    )) as Array<{ id?: string; deleted_at?: Date | null }>;

    const existingId = this.normalizeString(existing[0]?.id, 36);
    if (existingId) {
      if (existing[0]?.deleted_at) {
        await queryRunner.query(
          `UPDATE "ubicacion"
           SET "deleted_at" = NULL,
               "deleted_by" = NULL
           WHERE "id" = $1`,
          [existingId]
        );
      }
      return existingId;
    }

    const inserted = (await queryRunner.query(
      `INSERT INTO "ubicacion" (
        "nombre",
        "descripcion"
      ) VALUES ($1, $2)
      RETURNING "id"`,
      [
        MIGRATION_LOCATION_NAME,
        'Ubicacion tecnica creada por migracion de inventario economato.',
      ]
    )) as Array<{ id?: string }>;

    const ubicacionId = this.normalizeString(inserted[0]?.id, 36);
    if (!ubicacionId) {
      throw new Error('No se pudo crear la ubicacion de migracion.');
    }

    return ubicacionId;
  }

  private reserveBarcode(
    value: string | null,
    usedCodes: Set<string>
  ): string | null {
    if (!value) {
      return null;
    }

    const normalized = value.trim().slice(0, 130);
    if (!normalized) {
      return null;
    }

    if (usedCodes.has(normalized)) {
      return null;
    }

    usedCodes.add(normalized);
    return normalized;
  }

  private isRecord(value: unknown): value is SeedRecord {
    return typeof value === 'object' && value !== null;
  }
}

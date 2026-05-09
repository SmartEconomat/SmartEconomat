import { MigrationInterface, QueryRunner } from 'typeorm';

type RowId = { id: string };

/**
 * Fusiona `loserProductoId` en `winnerProductoId` (mismo nombre normalizado).
 * Conserva el ganador (created_at más antiguo). Repunta `producto_proveedor` e inventarios.
 */
async function mergeProductoInto(
  queryRunner: QueryRunner,
  winnerProductoId: string,
  loserProductoId: string
): Promise<void> {
  const ppLosers: Array<{ id: string; proveedor_id: string }> =
    await queryRunner.query(
      `SELECT id, proveedor_id AS proveedor_id FROM producto_proveedor
       WHERE producto_id = $1 AND deleted_at IS NULL`,
      [loserProductoId]
    );

  for (const ppL of ppLosers) {
    const wp: RowId[] = await queryRunner.query(
      `SELECT id FROM producto_proveedor
       WHERE producto_id = $1 AND proveedor_id = $2 AND deleted_at IS NULL
       LIMIT 1`,
      [winnerProductoId, ppL.proveedor_id]
    );

    if (!wp || wp.length === 0) {
      await queryRunner.query(
        `UPDATE producto_proveedor SET producto_id = $1, updated_at = NOW()
         WHERE id = $2`,
        [winnerProductoId, ppL.id]
      );
    } else {
      const winnerPpId = wp[0].id;
      await repointProductoProveedorRefs(queryRunner, winnerPpId, ppL.id);
      await mergeInventariosBetweenPp(queryRunner, winnerPpId, ppL.id);
      await queryRunner.query(
        `UPDATE producto_proveedor SET deleted_at = NOW(), updated_at = NOW()
         WHERE id = $1`,
        [ppL.id]
      );
    }
  }

  await queryRunner.query(
    `UPDATE merma SET producto_id = $1 WHERE producto_id = $2`,
    [winnerProductoId, loserProductoId]
  );

  await queryRunner.query(
    `DELETE FROM receta_ingrediente ri
     USING receta_ingrediente w
     WHERE ri.producto_id = $2
       AND w.receta_id = ri.receta_id
       AND w.producto_id = $1
       AND ri.id <> w.id`,
    [winnerProductoId, loserProductoId]
  );
  await queryRunner.query(
    `UPDATE receta_ingrediente SET producto_id = $1 WHERE producto_id = $2`,
    [winnerProductoId, loserProductoId]
  );

  await queryRunner.query(
    `INSERT INTO producto_alergeno (producto_id, alergeno)
     SELECT $1, pa.alergeno
     FROM producto_alergeno pa
     WHERE pa.producto_id = $2 AND pa.deleted_at IS NULL
     ON CONFLICT (producto_id, alergeno) DO NOTHING`,
    [winnerProductoId, loserProductoId]
  );
  await queryRunner.query(
    `DELETE FROM producto_alergeno WHERE producto_id = $1`,
    [loserProductoId]
  );

  await queryRunner.query(
    `UPDATE producto SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1`,
    [loserProductoId]
  );
}

async function repointProductoProveedorRefs(
  queryRunner: QueryRunner,
  winnerPpId: string,
  loserPpId: string
): Promise<void> {
  const tables = [
    'pedido_producto',
    'pedido_usuario_linea',
    'movimiento',
    'distribucion_linea',
    'transferencia_linea',
    'historial_precio',
  ];
  for (const tbl of tables) {
    await queryRunner.query(
      `UPDATE "${tbl}" SET producto_proveedor_id = $1 WHERE producto_proveedor_id = $2`,
      [winnerPpId, loserPpId]
    );
  }
}

async function mergeInventariosBetweenPp(
  queryRunner: QueryRunner,
  winnerPpId: string,
  loserPpId: string
): Promise<void> {
  const invs: Array<{
    id: string;
    ubicacion_id: string | null;
    fecha_caducidad: Date | null;
    cantidad_actual: string;
  }> = await queryRunner.query(
    `SELECT id, ubicacion_id, fecha_caducidad, cantidad_actual::text
     FROM inventario
     WHERE producto_proveedor_id = $1 AND deleted_at IS NULL`,
    [loserPpId]
  );

  for (const inv of invs) {
    const match: RowId[] = await queryRunner.query(
      `SELECT id FROM inventario
       WHERE producto_proveedor_id = $1 AND deleted_at IS NULL
         AND COALESCE(ubicacion_id::text, '') = COALESCE($2::text, '')
         AND fecha_caducidad IS NOT DISTINCT FROM $3::timestamptz
       LIMIT 1`,
      [winnerPpId, inv.ubicacion_id, inv.fecha_caducidad]
    );

    if (match && match.length > 0) {
      const wId = match[0].id;
      await queryRunner.query(
        `UPDATE inventario SET cantidad_actual = cantidad_actual + $1::numeric,
            updated_at = NOW()
         WHERE id = $2`,
        [inv.cantidad_actual, wId]
      );
      await queryRunner.query(
        `UPDATE inventario SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1`,
        [inv.id]
      );
    } else {
      await queryRunner.query(
        `UPDATE inventario SET producto_proveedor_id = $1, updated_at = NOW()
         WHERE id = $2`,
        [winnerPpId, inv.id]
      );
    }
  }
}

/**
 * Sanea duplicados de nombre (insensible a mayúsculas), recalcula PMP de catálogo sin stock
 * y añade unicidad parcial en BD.
 */
export class ProductoDedupeNombreYPmpReferencia1776330000000 implements MigrationInterface {
  name = 'ProductoDedupeNombreYPmpReferencia1776330000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const groups: Array<{ nrm: string; ids: unknown }> =
      await queryRunner.query(`
        SELECT lower(trim(both from nombre)) AS nrm,
               json_agg(id ORDER BY created_at ASC) AS ids
        FROM producto
        WHERE deleted_at IS NULL
        GROUP BY 1
        HAVING count(*) > 1
      `);

    for (const g of groups) {
      const rawIds = g.ids;
      const ids = Array.isArray(rawIds)
        ? (rawIds as string[])
        : (JSON.parse(String(rawIds)) as string[]);
      if (!ids || ids.length < 2) {
        continue;
      }
      const winner = ids[0];
      for (let i = 1; i < ids.length; i++) {
        const loser = ids[i];
        await mergeProductoInto(queryRunner, winner, loser);
      }
    }

    await queryRunner.query(`
      WITH ref AS (
        SELECT p.id AS producto_id,
          COALESCE(
            (
              SELECT AVG(sub.ref)::numeric(10,4)
              FROM (
                SELECT DISTINCT pp.id,
                  CASE
                    WHEN COALESCE(pp.pmp, 0) > 0 THEN pp.pmp::numeric
                    WHEN pp.precio_unitario IS NOT NULL AND pp.precio_unitario > 0
                      THEN pp.precio_unitario::numeric
                  END AS ref
                FROM producto_proveedor pp
                WHERE pp.producto_id = p.id AND pp.deleted_at IS NULL
              ) sub
              WHERE sub.ref IS NOT NULL
            ),
            0::numeric
          ) AS ref_pmp
        FROM producto p
        WHERE p.deleted_at IS NULL
      )
      UPDATE producto p
      SET pmp = ref.ref_pmp, updated_at = NOW()
      FROM ref
      WHERE p.id = ref.producto_id
        AND ref.ref_pmp > 0
        AND (p.pmp IS NULL OR p.pmp = 0)
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_producto_nombre_activo_ci"
      ON "producto" (lower(trim(both from nombre)))
      WHERE deleted_at IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."UQ_producto_nombre_activo_ci"`
    );
  }
}

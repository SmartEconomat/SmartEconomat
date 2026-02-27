import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateInventario1679990000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'local_inventario') THEN
          CREATE TYPE "local_inventario" AS ENUM (
            'Almacen A',
            'Frigorifico A',
            'Bodega A',
            'Almacen B',
            'Frigorifico B',
            'Bodega B'
          );
        END IF;
      END$$;
    `);

    await queryRunner.createTable(
      new Table({
        name: 'inventario',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v7()',
          },
          { name: 'id_producto_proveedor', type: 'uuid', isNullable: false },
          { name: 'cantidad_actual', type: 'int', isNullable: false },
          { name: 'cantidad_minima', type: 'int', isNullable: false },
          { name: 'cantidad_maxima', type: 'int', isNullable: true },
          {
            name: 'ubicacion_almacen',
            type: 'local_inventario',
            isNullable: false,
          },
          {
            name: 'fecha_entrada',
            type: 'timestamptz',
            isNullable: false,
            default: 'CURRENT_TIMESTAMP',
          },
          { name: 'fecha_caducidad', type: 'timestamptz', isNullable: false },
          {
            name: 'created_at',
            type: 'timestamptz',
            isNullable: false,
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            isNullable: false,
            default: 'CURRENT_TIMESTAMP',
          },
          { name: 'deleted_at', type: 'timestamptz', isNullable: true },
          { name: 'deleted_by', type: 'uuid', isNullable: true },
          { name: 'version', type: 'int', isNullable: false, default: '1' },
        ],
        checks: [
          {
            name: 'chk_cantidad_actual_nonnegative',
            expression: 'cantidad_actual >= 0',
          },
          {
            name: 'chk_cantidad_minima_nonnegative',
            expression: 'cantidad_minima >= 0',
          },
          {
            name: 'chk_cantidad_maxima_coherent',
            expression:
              'cantidad_maxima IS NULL OR cantidad_maxima >= cantidad_minima',
          },
        ],
      })
    );

    await queryRunner.createIndex(
      'inventario',
      new TableIndex({
        name: 'idx_inventario_producto_proveedor',
        columnNames: ['id_producto_proveedor'],
      })
    );
    await queryRunner.createIndex(
      'inventario',
      new TableIndex({
        name: 'idx_inventario_ubicacion',
        columnNames: ['ubicacion_almacen'],
      })
    );
    await queryRunner.createIndex(
      'inventario',
      new TableIndex({
        name: 'idx_inventario_fecha_caducidad',
        columnNames: ['fecha_caducidad'],
      })
    );
    await queryRunner.createIndex(
      'inventario',
      new TableIndex({
        name: 'idx_inventario_ubicacion_caducidad',
        columnNames: ['ubicacion_almacen', 'fecha_caducidad'],
      })
    );

    await queryRunner.createForeignKey(
      'inventario',
      new TableForeignKey({
        columnNames: ['id_producto_proveedor'],
        referencedTableName: 'producto_proveedor',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('inventario');
    await queryRunner.query('DROP TYPE IF EXISTS "local_inventario"');
  }
}

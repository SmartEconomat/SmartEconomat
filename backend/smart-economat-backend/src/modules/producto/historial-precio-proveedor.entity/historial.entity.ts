import { ColumnNumericTransformer } from '../../../common/transformers/column-numeric.transformer';
import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ProductoProveedor } from '../producto-proveedor.entity/producto-proveedor.entity';

@Entity({ name: 'historial_precio' })
export class HistorialPrecio {
  @PrimaryColumn('uuid', {
    name: 'id_historial_precio',
    default: () => 'uuid_generate_v7()',
  })
  readonly id!: string;

  @ManyToOne(() => ProductoProveedor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_producto_proveedor' })
  productoProveedor!: ProductoProveedor;

  @Column({
    type: 'decimal',
    nullable: false,
    precision: 10,
    scale: 2,
    transformer: new ColumnNumericTransformer(),
  })
  precio?: number;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  fecha!: Date;
}

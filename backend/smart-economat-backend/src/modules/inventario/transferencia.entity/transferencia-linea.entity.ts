import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type { Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ColumnNumericTransformer } from '../../../common/transformers/column-numeric.transformer';
import { Inventario } from '../inventario.entity/inventario.entity';
import { Ubicacion } from '../../ubicacion/ubicacion.entity/ubicacion.entity';
import { ProductoProveedor } from '../../producto/producto-proveedor.entity/producto-proveedor.entity';
import { Transferencia } from './transferencia.entity';

/** Línea de transferencia: cantidad trasladada entre saldos con trazabilidad. */
@Entity({ name: 'transferencia_linea' })
@Index(['transferenciaId'])
@Check(`"cantidad" > 0`)
export class TransferenciaLinea extends BaseEntity {
  @Column({ name: 'transferencia_id' })
  transferenciaId!: string;

  @ManyToOne(() => Transferencia, (t) => t.lineas, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'transferencia_id' })
  transferencia!: Relation<Transferencia>;

  @Column({ name: 'inventario_origen_id' })
  inventarioOrigenId!: string;

  @ManyToOne(() => Inventario, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'inventario_origen_id' })
  inventarioOrigen!: Relation<Inventario>;

  @Column({ name: 'inventario_destino_id', nullable: true })
  inventarioDestinoId?: string | null;

  @ManyToOne(() => Inventario, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'inventario_destino_id' })
  inventarioDestino?: Relation<Inventario>;

  @Column({ name: 'ubicacion_origen_id', nullable: true })
  ubicacionOrigenId?: string | null;

  @ManyToOne(() => Ubicacion, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'ubicacion_origen_id' })
  ubicacionOrigen?: Relation<Ubicacion>;

  @Column({ name: 'ubicacion_destino_id' })
  ubicacionDestinoId!: string;

  @ManyToOne(() => Ubicacion, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'ubicacion_destino_id' })
  ubicacionDestino!: Relation<Ubicacion>;

  @Column({ name: 'producto_proveedor_id' })
  productoProveedorId!: string;

  @ManyToOne(() => ProductoProveedor, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'producto_proveedor_id' })
  productoProveedor!: Relation<ProductoProveedor>;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 3,
    transformer: new ColumnNumericTransformer(),
  })
  cantidad!: number;
}

import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type { Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ColumnNumericTransformer } from '../../../common/transformers/column-numeric.transformer';
import { Producto } from '../../producto/producto.entity/producto.entity';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';
import { MotivoMerma, TipoMerma } from '../enums/merma.enums';

@Entity({ name: 'merma' })
@Index(['productoId'])
@Index(['motivo'])
@Index(['tipo'])
@Index(['usuarioId'])
@Index(['createdAt'])
@Index(['tipo', 'createdAt'])
@Index(['origenEntidad', 'origenId'])
@Index(['idempotencyKey'], { unique: true })
@Check(`"cantidad" > 0`)
export class Merma extends BaseEntity {
  @Column({ name: 'producto_id' })
  productoId!: string;

  @Column({ name: 'usuario_id', nullable: true })
  usuarioId?: string;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 3,
    transformer: new ColumnNumericTransformer(),
  })
  cantidad!: number;

  @Column({ type: 'enum', enum: MotivoMerma })
  motivo!: MotivoMerma;

  @Column({
    type: 'enum',
    enum: TipoMerma,
    default: TipoMerma.INVENTARIO,
  })
  tipo!: TipoMerma;

  @Column({ type: 'text', nullable: true })
  notas?: string;

  @Column({
    name: 'origen_entidad',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  origenEntidad?: string;

  @Column({ name: 'origen_id', type: 'uuid', nullable: true })
  origenId?: string;

  @Column({ name: 'referencia_id', type: 'uuid', nullable: true })
  referenciaId?: string;

  @Column({ name: 'idempotency_key', type: 'uuid', nullable: true })
  idempotencyKey?: string;

  @ManyToOne(() => Producto, (producto) => producto.mermas, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'producto_id' })
  producto!: Relation<Producto>;

  @ManyToOne(() => Usuario, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'usuario_id' })
  usuario?: Relation<Usuario>;
}

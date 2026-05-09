import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type { Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ColumnNumericTransformer } from '../../../common/transformers/column-numeric.transformer';
import { Distribucion } from '../distribucion.entity/distribucion.entity';
import { PedidoUsuarioLinea } from '../../pedido/pedido-usuario-linea.entity/pedido-usuario-linea.entity';
import { ProductoProveedor } from '../../producto/producto-proveedor.entity/producto-proveedor.entity';
import { EstadoDistribucionLinea } from '../enums/estado-distribucion.enum';

/** Clase pública (DistribucionLinea). Paquete: smart-economat-backend (Nest). */
@Entity({ name: 'distribucion_linea' })
@Index(['distribucionId'])
@Index(['pedidoUsuarioLineaId'])
@Index(['productoProveedorId'])
@Check(`"cantidad_pedida" >= 0`)
@Check(`"cantidad_recepcionada_atribuida" >= 0`)
@Check(`"cantidad_ya_distribuida" >= 0`)
@Check(`"cantidad_a_distribuir" > 0`)
@Check(`"cantidad_entregada" >= 0`)
export class DistribucionLinea extends BaseEntity {
  @Column({ name: 'distribucion_id' })
  distribucionId!: string;

  @Column({ name: 'pedido_usuario_linea_id' })
  pedidoUsuarioLineaId!: string;

  @Column({ name: 'producto_proveedor_id' })
  productoProveedorId!: string;

  @ManyToOne(() => Distribucion, (distribucion) => distribucion.lineas, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'distribucion_id' })
  distribucion!: Relation<Distribucion>;

  @ManyToOne(() => PedidoUsuarioLinea, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'pedido_usuario_linea_id' })
  pedidoUsuarioLinea!: Relation<PedidoUsuarioLinea>;

  @ManyToOne(() => ProductoProveedor, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'producto_proveedor_id' })
  productoProveedor!: Relation<ProductoProveedor>;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 3,
    name: 'cantidad_pedida',
    transformer: new ColumnNumericTransformer(),
  })
  cantidadPedida!: number;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 3,
    name: 'cantidad_recepcionada_atribuida',
    transformer: new ColumnNumericTransformer(),
  })
  cantidadRecepcionadaAtribuida!: number;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 3,
    name: 'cantidad_ya_distribuida',
    default: 0,
    transformer: new ColumnNumericTransformer(),
  })
  cantidadYaDistribuida!: number;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 3,
    name: 'cantidad_a_distribuir',
    transformer: new ColumnNumericTransformer(),
  })
  cantidadADistribuir!: number;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 3,
    name: 'cantidad_entregada',
    default: 0,
    transformer: new ColumnNumericTransformer(),
  })
  cantidadEntregada!: number;

  @Column({
    type: 'enum',
    enum: EstadoDistribucionLinea,
    default: EstadoDistribucionLinea.PENDIENTE,
  })
  estado!: EstadoDistribucionLinea;

  @Column({ type: 'text', nullable: true })
  observaciones?: string;
}

import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import type { Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Incidencia } from '../incidencia.entity/incidencia.entity';
import { PedidoProducto } from '../../pedido/pedido-producto.entity/pedido-producto.entity';
import { ColumnNumericTransformer } from '../../../common/transformers/column-numeric.transformer';

export enum TipoDiferencia {
  FALTANTE = 'FALTANTE',
  EXCESO = 'EXCESO',
  DEFECTUOSO = 'DEFECTUOSO',
}

export enum EstadoReclamacion {
  PENDIENTE = 'PENDIENTE',
  RECLAMADO = 'RECLAMADO',
  ABONADO = 'ABONADO',
  REENVIADO = 'REENVIADO',
}

@Entity({ name: 'incidencia_linea' })
@Index(['incidenciaId'])
@Index(['pedidoProductoId'])
export class IncidenciaLinea extends BaseEntity {
  @Column({ name: 'incidencia_id' })
  incidenciaId!: string;

  @Column({ name: 'pedido_producto_id' })
  pedidoProductoId!: string;

  @ManyToOne(() => Incidencia, (incidencia) => incidencia.lineas, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'incidencia_id' })
  incidencia!: Relation<Incidencia>;

  @ManyToOne(() => PedidoProducto, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'pedido_producto_id' })
  pedidoProducto!: Relation<PedidoProducto>;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 3,
    name: 'cantidad_esperada',
    transformer: new ColumnNumericTransformer(),
  })
  cantidadEsperada!: number;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 3,
    name: 'cantidad_recibida',
    transformer: new ColumnNumericTransformer(),
  })
  cantidadRecibida!: number;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 3,
    name: 'diferencia',
    transformer: new ColumnNumericTransformer(),
  })
  diferencia!: number;

  @Column({
    type: 'enum',
    enum: TipoDiferencia,
    name: 'tipo_diferencia',
  })
  tipoDiferencia!: TipoDiferencia;

  @Column({
    type: 'enum',
    enum: EstadoReclamacion,
    name: 'estado_reclamacion',
    default: EstadoReclamacion.PENDIENTE,
  })
  estadoReclamacion!: EstadoReclamacion;

  @Column({ type: 'text', nullable: true })
  observaciones?: string;
}

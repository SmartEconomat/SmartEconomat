import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';
import { PedidoUsuario } from '../../pedido/pedido-usuario.entity/pedido-usuario.entity';
import { Ubicacion } from '../../ubicacion/ubicacion.entity/ubicacion.entity';
import { AlumnoSlot } from '../../profesor/profesor.entity/alumno-slot.entity';
import { EstadoDistribucion } from '../enums/estado-distribucion.enum';
import { DistribucionLinea } from '../distribucion-linea.entity/distribucion-linea.entity';

/** Clase pública (Distribucion). Paquete: smart-economat-backend (Nest). */
@Entity({ name: 'distribucion' })
@Index(['pedidoUsuarioId'])
@Index(['usuarioResponsableId'])
@Index(['estado'])
@Index(['ubicacionOrigenId'])
@Index(['ubicacionDestinoId'])
@Index(['idempotencyKey'], {
  unique: true,
  where: '"idempotency_key" IS NOT NULL',
})
export class Distribucion extends BaseEntity {
  @Column({ name: 'usuario_responsable_id', nullable: true })
  usuarioResponsableId?: string;

  @Column({ name: 'pedido_usuario_id' })
  pedidoUsuarioId!: string;

  @Column({ name: 'ubicacion_origen_id' })
  ubicacionOrigenId!: string;

  @Column({ name: 'ubicacion_destino_id' })
  ubicacionDestinoId!: string;

  @Column({ name: 'alumno_slot_id', nullable: true })
  alumnoSlotId?: string;

  @ManyToOne(() => Usuario, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'usuario_responsable_id' })
  usuarioResponsable?: Relation<Usuario>;

  @ManyToOne(() => PedidoUsuario, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'pedido_usuario_id' })
  pedidoUsuario!: Relation<PedidoUsuario>;

  @ManyToOne(() => Ubicacion, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'ubicacion_origen_id' })
  ubicacionOrigen!: Relation<Ubicacion>;

  @ManyToOne(() => Ubicacion, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'ubicacion_destino_id' })
  ubicacionDestino!: Relation<Ubicacion>;

  @ManyToOne(() => AlumnoSlot, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'alumno_slot_id' })
  alumnoSlot?: Relation<AlumnoSlot>;

  @Column({
    type: 'enum',
    enum: EstadoDistribucion,
    default: EstadoDistribucion.PREPARADA,
  })
  estado!: EstadoDistribucion;

  @Column({
    name: 'fecha_preparacion',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fechaPreparacion!: Date;

  @Column({ name: 'fecha_entrega', type: 'timestamptz', nullable: true })
  fechaEntrega?: Date;

  @Column({ type: 'text', nullable: true })
  observaciones?: string;

  @Column({ name: 'motivo_cancelacion', type: 'text', nullable: true })
  motivoCancelacion?: string;

  @OneToMany(() => DistribucionLinea, (linea) => linea.distribucion, {
    cascade: true,
  })
  lineas!: Relation<DistribucionLinea[]>;

  /** Clave de idempotencia opcional para prevenir distribuciones duplicadas por doble clic o retry. */
  @Column({
    name: 'idempotency_key',
    type: 'uuid',
    nullable: true,
    unique: true,
  })
  idempotencyKey?: string;
}

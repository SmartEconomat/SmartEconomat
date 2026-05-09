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
import { EstadoTransferencia } from '../enums/estado-transferencia.enum';
import { TransferenciaLinea } from './transferencia-linea.entity';

/** Orden formal de traslado entre ubicaciones (cabecera). */
@Entity({ name: 'transferencia' })
@Index(['estado'])
@Index(['createdAt'])
export class Transferencia extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 24,
    default: EstadoTransferencia.COMPLETADA,
  })
  estado!: EstadoTransferencia;

  @Column({ name: 'usuario_id', nullable: true })
  usuarioId?: string | null;

  @ManyToOne(() => Usuario, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'usuario_id' })
  usuario?: Relation<Usuario>;

  @Column({ type: 'text', nullable: true })
  observaciones?: string | null;

  @Column({
    name: 'idempotencia_key',
    type: 'varchar',
    length: 128,
    nullable: true,
    unique: true,
  })
  idempotenciaKey?: string | null;

  @OneToMany(() => TransferenciaLinea, (l) => l.transferencia, {
    cascade: ['insert'],
  })
  lineas!: Relation<TransferenciaLinea[]>;
}

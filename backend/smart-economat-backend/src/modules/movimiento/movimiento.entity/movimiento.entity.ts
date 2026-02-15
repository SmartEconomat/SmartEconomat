import {
  Entity,
  Column,
  ManyToOne,
  PrimaryColumn,
  Check,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { TipoMovimiento } from '../enums/movimiento.enums';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';

@Entity({ name: 'movimiento' })
@Check(`"cantidad" > 0`)
export class Movimiento {
  @PrimaryColumn('uuid', {
    name: 'id_movimiento',
    default: () => 'uuid_generate_v7()',
  })
  readonly id!: string;

  @Column({
    type: 'enum',
    enum: TipoMovimiento,
    enumName: 'tipo_movimiento',
    nullable: false,
  })
  tipo!: TipoMovimiento;

  @Column({ type: 'int', nullable: false })
  cantidad!: number;

  @Column({ type: 'text', nullable: true })
  descripcion?: string | null;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  fecha!: Date;

  @Column({ type: 'varchar', length: 50 })
  entidad!: string;

  @Column({ type: 'varchar', length: 255 })
  entidadId!: string;

  @ManyToOne(() => Usuario, (usuario) => usuario.movimientos, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'id_usuario', referencedColumnName: 'id' })
  usuario!: Usuario;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  readonly createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  readonly updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at' })
  deletedAt?: Date;
}

import {
  Entity,
  Column,
  ManyToOne,
  PrimaryGeneratedColumn,
  Check,
  JoinColumn,
} from 'typeorm';
import { TipoMovimiento } from '../enums/movimiento.enums';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';

@Entity({ name: 'movimiento' })
@Check(`"cantidad" > 0`)
export class Movimiento {
  @PrimaryGeneratedColumn({ name: 'id_movimiento', type: 'int' })
  id!: number;

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

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fecha!: Date;

  @ManyToOne(() => Usuario, (usuario) => usuario.movimientos, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_usuario', referencedColumnName: 'id' })
  usuario!: Usuario;

  @Column({ type: 'uuid', nullable: false })
  inventario!: string;
}

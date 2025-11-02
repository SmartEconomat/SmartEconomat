import {
  Entity,
  Column,
  ManyToOne,
  PrimaryGeneratedColumn,
  Check,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { TipoMovimiento } from '../enums/movimiento.enums';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';
import { Inventario } from '../../inventario/inventario.entity/inventario.entity';

@Entity({ name: 'movimiento' })
@Check(`"cantidad" > 0`)
export class Movimiento {
  @PrimaryGeneratedColumn({ name: 'id_movimiento', type: 'int' })
  id_movimiento!: number;

  @Column({
    type: 'enum',
    enum: TipoMovimiento,
    name: 'tipo',
    enumName: 'tipo_movimiento',
    nullable: false,
  })
  tipo!: TipoMovimiento;

  @Column({ type: 'int', name: 'cantidad', nullable: false })
  cantidad!: number;

  @Column({ type: 'text', name: 'descripcion', nullable: true })
  descripcion?: string | null;

  @Column({
    type: 'timestamp',
    name: 'fecha',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fecha!: Date;

  @ManyToOne(() => Usuario, (usuario) => usuario.movimientos, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_usuario', referencedColumnName: 'id_usuario' })
  usuario!: Usuario;

  @ManyToOne(() => Inventario, (inv) => inv.movimientos, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_inventario', referencedColumnName: 'id_inventario' })
  inventario!: Inventario;
}

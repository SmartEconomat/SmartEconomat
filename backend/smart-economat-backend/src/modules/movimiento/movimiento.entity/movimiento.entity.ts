import {
  Entity,
  Column,
  ManyToOne,
  PrimaryGeneratedColumn,
  Check,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { TipoMovimiento } from '../enums/movimiento.enums';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';
import { Inventario } from '../../inventario/inventario.entity/inventario.entity';

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

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha!: Date;

  @Column({ type: 'varchar', length: 50 })
  entidad!: string;

  @Column({ type: 'varchar', length: 255 })
  entidadId!: string;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
  })
  updatedAt: Date;

  @DeleteDateColumn({
    name: 'deleted_at',
  })
  deletedAt?: Date;

  @ManyToOne(() => Usuario, (usuario) => usuario.movimientos, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_usuario', referencedColumnName: 'id' })
  usuario!: Usuario;

  @ManyToOne(() => Inventario, (inventario) => inventario.movimientos, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_inventario', referencedColumnName: 'id' })
  inventario!: Inventario;
}

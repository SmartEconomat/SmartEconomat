import { Entity, OneToMany, PrimaryGeneratedColumn, Column } from 'typeorm';
import { rolUsuario } from '../enums/usuario.enums';
import { Movimiento } from '../../movimiento/movimiento.entity/movimiento.entity';

@Entity({ name: 'usuario' })
export class Usuario {
  @PrimaryGeneratedColumn('uuid', { name: 'id_usuario' })
  id!: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  nombre!: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
    unique: true,
  })
  username: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  password!: string;

  @Column({
    type: 'enum',
    enum: rolUsuario,
    enumName: 'rol_usuario',
    default: rolUsuario.ADMINISTRADOR,
  })
  rol!: rolUsuario;

  @Column({ type: 'varchar', length: 150, nullable: false })
  email!: string;

  @Column({ type: 'boolean', default: true })
  activo!: boolean;

  @OneToMany(() => Movimiento, (mov) => mov.usuario)
  movimientos?: Movimiento[];
}

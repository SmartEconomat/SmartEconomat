import {
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { rolUsuario } from '../enums/usuario.enums';
import { Movimiento } from '../../movimiento/movimiento.entity/movimiento.entity';
import { Pedido } from '../../pedidos/pedido.entity/pedido.entity';
import { Recepcion } from '../../recepcion/recepcion.entity/recepcion.entity';
import { Incidencia } from '../../incidencia/incidencia.entity/incidencia.entity';

@Entity({ name: 'usuario' })
export class Usuario {
  @PrimaryGeneratedColumn('uuid', { name: 'id_usuario' })
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  nombre!: string;

  @Column({
    type: 'varchar',
    length: 100,
    unique: true,
  })
  username!: string;

  @Column({ type: 'varchar', length: 255 })
  password!: string;

  @Index('idx_usuario_rol', ['rol'])
  @Column({
    type: 'enum',
    enum: rolUsuario,
    enumName: 'rol_usuario',
    default: rolUsuario.ALUMNO,
  })
  rol!: rolUsuario;

  @Column({ type: 'varchar', length: 150, unique: true })
  email!: string;

  @Index('idx_usuario_activo', ['activo'])
  @Column({ type: 'boolean', default: true })
  activo!: boolean;

  @Column({ type: 'varchar', length: 100, unique: true, nullable: true })
  cial_profesor?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  numero_clase?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  aula?: string;

  @OneToMany(() => Movimiento, (mov) => mov.usuario)
  movimientos: Movimiento[];

  @OneToMany(() => Pedido, (pedido) => pedido.usuario)
  pedidos: Pedido[];

  @OneToMany(() => Recepcion, (recepcion) => recepcion.usuario)
  recepciones: Recepcion[];

  @OneToMany(() => Incidencia, (incidencia) => incidencia.usuarioResolutor)
  incidenciasResueltas!: Incidencia[];

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}

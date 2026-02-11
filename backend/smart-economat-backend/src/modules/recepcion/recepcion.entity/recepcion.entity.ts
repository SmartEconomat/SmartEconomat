import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { RecepcionPedido } from '../recepcion-pedido.entity/recepcion-pedido.entity';
import { RecepcionProducto } from '../recepcion-productos.entity/recepcion-producto.entity';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';

@Entity('recepcion')
export class Recepcion {
  @PrimaryGeneratedColumn({ name: 'id_recepcion' })
  id: number;

  @Column({
    name: 'fecha_recepcion',
    type: 'date',
    default: () => 'CURRENT_DATE',
  })
  fechaRecepcion!: Date;

  @Column({ type: 'text', nullable: true })
  observaciones?: string;

  @ManyToOne(() => Usuario, (usuario) => usuario.recepciones, {
    nullable: false,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'id_usuario_receptor' })
  usuario!: Usuario;

  @OneToMany(() => RecepcionPedido, (rp) => rp.recepcion)
  recepcionesPedido!: RecepcionPedido[];

  @OneToMany(() => RecepcionProducto, (rp) => rp.recepcion)
  recepcionesProducto!: RecepcionProducto[];

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
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { RecepcionPedido } from '../recepcion-pedido.entity/recepcion-pedido.entity';
import { RecepcionProducto } from '../recepcion-productos.entity/recepcion-producto.entity';
import { Usuario } from 'src/modules/usuario/usuario.entity/usuario.entity';

@Entity('recepcion')
export class Recepcion {
  @PrimaryGeneratedColumn({ name: 'id_recepcion' })
  id: number;

  @ManyToOne(() => Usuario, (usuario) => usuario.recepciones, {
    nullable: false,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'id_usuario_receptor' })
  usuario!: Usuario;

  @Column({
    name: 'fecha_recepcion',
    type: 'date',
    default: () => 'CURRENT_DATE',
  })
  fechaRecepcion!: Date;

  @Column({ type: 'text', nullable: true })
  observaciones?: string;

  @OneToMany(() => RecepcionPedido, (rp) => rp.recepcion)
  recepcionesPedido!: RecepcionPedido[];

  @OneToMany(() => RecepcionProducto, (rp) => rp.recepcion)
  recepcionesProducto!: RecepcionProducto[];
}

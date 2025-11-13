import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { RecepcionPedido } from '../recepcion-pedido.entity/recepcion-pedido.entity';
import { RecepcionProducto } from '../recepcion-productos.entity/recepcion-producto.entity';

@Entity('recepcion')
export class Recepcion {
  @PrimaryGeneratedColumn({ name: 'id_recepcion' })
  id: number;

  @Column({ type: 'uuid', name: 'id_usuario_receptor' })
  usuario: string;

  @Column({
    name: 'fecha_recepcion',
    type: 'date',
    default: () => 'CURRENT_DATE',
  })
  fechaRecepcion: Date;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @OneToMany(() => RecepcionPedido, (rp) => rp.recepcion)
  recepcionesPedido: RecepcionPedido[];

  @OneToMany(() => RecepcionProducto, (rp) => rp.recepcion)
  recepcionesProducto: RecepcionProducto[];
}

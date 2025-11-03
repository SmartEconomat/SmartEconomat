import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'albaran_pedido_recepcion' })
export class AlbaranPedidoRecepcion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  id_albaran: string;

  @Column({ type: 'uuid' })
  id_pedido_recepcion: string;
}
